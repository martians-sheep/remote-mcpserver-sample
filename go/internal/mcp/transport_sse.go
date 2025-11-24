package mcp

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
)

// SSEConnection represents a single SSE connection
type SSEConnection struct {
	server   *Server
	writer   http.ResponseWriter
	flusher  http.Flusher
	done     chan struct{}
	writeMux sync.Mutex
}

// NewSSEConnection creates a new SSE connection
func NewSSEConnection(server *Server, w http.ResponseWriter) (*SSEConnection, error) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		return nil, fmt.Errorf("streaming unsupported")
	}

	return &SSEConnection{
		server:  server,
		writer:  w,
		flusher: flusher,
		done:    make(chan struct{}),
	}, nil
}

// Start initializes the SSE connection
func (c *SSEConnection) Start() {
	// Set headers for SSE
	c.writer.Header().Set("Content-Type", "text/event-stream")
	c.writer.Header().Set("Cache-Control", "no-cache")
	c.writer.Header().Set("Connection", "keep-alive")
	c.writer.Header().Set("X-Accel-Buffering", "no")

	c.flusher.Flush()
}

// HandleMessage processes an incoming message from the client
func (c *SSEConnection) HandleMessage(data []byte) error {
	response, err := c.server.HandleRequest(data)
	if err != nil {
		log.Printf("Error handling request: %v", err)
		return err
	}

	// Skip if no response (notification)
	if response == nil {
		return nil
	}

	// Send response as SSE event
	return c.SendEvent("message", string(response))
}

// SendEvent sends an SSE event to the client
func (c *SSEConnection) SendEvent(event, data string) error {
	c.writeMux.Lock()
	defer c.writeMux.Unlock()

	if event != "" {
		if _, err := fmt.Fprintf(c.writer, "event: %s\n", event); err != nil {
			return err
		}
	}

	if _, err := fmt.Fprintf(c.writer, "data: %s\n\n", data); err != nil {
		return err
	}

	c.flusher.Flush()
	return nil
}

// SendEndpoint sends the endpoint event to establish the message endpoint
func (c *SSEConnection) SendEndpoint(endpoint string) error {
	return c.SendEvent("endpoint", endpoint)
}

// Close closes the SSE connection
func (c *SSEConnection) Close() {
	close(c.done)
}

// Done returns a channel that's closed when the connection is done
func (c *SSEConnection) Done() <-chan struct{} {
	return c.done
}

// HandleSSERequest handles an SSE connection request
func HandleSSERequest(server *Server, w http.ResponseWriter, r *http.Request, messageEndpoint string) error {
	conn, err := NewSSEConnection(server, w)
	if err != nil {
		return err
	}

	conn.Start()

	// Send the message endpoint
	if err := conn.SendEndpoint(messageEndpoint); err != nil {
		return err
	}

	log.Println("SSE connection established")

	// Keep connection alive
	<-r.Context().Done()
	log.Println("SSE connection closed")

	return nil
}

// HandleMessagePost handles a POST request to the message endpoint
func HandleMessagePost(server *Server, w http.ResponseWriter, r *http.Request) error {
	// Read the request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return err
	}
	defer r.Body.Close()

	// Handle the request
	response, err := server.HandleRequest(body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return err
	}

	// Skip if no response (notification)
	if response == nil {
		w.WriteHeader(http.StatusNoContent)
		return nil
	}

	// Send response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if _, err := w.Write(response); err != nil {
		return err
	}

	return nil
}

// ReadSSEMessages reads messages from an SSE stream (client-side)
func ReadSSEMessages(reader *bufio.Reader) (chan string, chan error) {
	messages := make(chan string)
	errors := make(chan error)

	go func() {
		defer close(messages)
		defer close(errors)

		var currentData string

		for {
			line, err := reader.ReadString('\n')
			if err != nil {
				if err != io.EOF {
					errors <- err
				}
				return
			}

			line = line[:len(line)-1] // Remove trailing \n

			if line == "" {
				// Empty line means end of event
				if currentData != "" {
					messages <- currentData
					currentData = ""
				}
				continue
			}

			if len(line) > 5 && line[:5] == "data:" {
				if currentData != "" {
					currentData += "\n"
				}
				currentData += line[6:]
			}
		}
	}()

	return messages, errors
}

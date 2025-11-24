package mcp

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"os"
)

// StdioTransport handles stdio-based transport for MCP
type StdioTransport struct {
	server *Server
	reader *bufio.Reader
	writer io.Writer
}

// NewStdioTransport creates a new stdio transport
func NewStdioTransport(server *Server) *StdioTransport {
	return &StdioTransport{
		server: server,
		reader: bufio.NewReader(os.Stdin),
		writer: os.Stdout,
	}
}

// Start starts the stdio transport loop
func (t *StdioTransport) Start() error {
	log.Println("MCP Server (stdio) started")

	for {
		// Read line from stdin
		line, err := t.reader.ReadBytes('\n')
		if err != nil {
			if err == io.EOF {
				log.Println("EOF received, shutting down")
				return nil
			}
			return fmt.Errorf("failed to read from stdin: %w", err)
		}

		// Skip empty lines
		if len(line) == 0 || (len(line) == 1 && line[0] == '\n') {
			continue
		}

		// Handle request
		response, err := t.server.HandleRequest(line)
		if err != nil {
			log.Printf("Error handling request: %v", err)
			continue
		}

		// Skip if no response (notification)
		if response == nil {
			continue
		}

		// Write response to stdout
		if _, err := t.writer.Write(response); err != nil {
			return fmt.Errorf("failed to write response: %w", err)
		}
		if _, err := t.writer.Write([]byte("\n")); err != nil {
			return fmt.Errorf("failed to write newline: %w", err)
		}
	}
}

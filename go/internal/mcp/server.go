package mcp

import (
	"encoding/json"
	"fmt"
	"log"
)

const (
	ProtocolVersion = "2024-11-05"
	ServerName      = "go-mcp-server"
	ServerVersion   = "1.0.0"
)

// Server represents an MCP server
type Server struct {
	tools        map[string]Tool
	toolHandlers map[string]ToolHandler
	initialized  bool
}

// NewServer creates a new MCP server
func NewServer() *Server {
	return &Server{
		tools:        make(map[string]Tool),
		toolHandlers: make(map[string]ToolHandler),
		initialized:  false,
	}
}

// RegisterTool registers a new tool with the server
func (s *Server) RegisterTool(tool Tool, handler ToolHandler) {
	s.tools[tool.Name] = tool
	s.toolHandlers[tool.Name] = handler
	log.Printf("Registered tool: %s", tool.Name)
}

// HandleRequest processes a JSON-RPC request and returns a response
func (s *Server) HandleRequest(reqData []byte) ([]byte, error) {
	var req JSONRPCRequest
	if err := json.Unmarshal(reqData, &req); err != nil {
		return s.errorResponse(nil, -32700, "Parse error", nil)
	}

	// Handle different methods
	switch req.Method {
	case "initialize":
		return s.handleInitialize(req)
	case "initialized":
		return s.handleInitialized(req)
	case "tools/list":
		return s.handleListTools(req)
	case "tools/call":
		return s.handleCallTool(req)
	case "ping":
		return s.handlePing(req)
	default:
		return s.errorResponse(req.ID, -32601, fmt.Sprintf("Method not found: %s", req.Method), nil)
	}
}

// handleInitialize handles the initialize request
func (s *Server) handleInitialize(req JSONRPCRequest) ([]byte, error) {
	result := InitializeResult{
		ProtocolVersion: ProtocolVersion,
		Capabilities: map[string]interface{}{
			"tools": map[string]interface{}{},
		},
		ServerInfo: ServerInfo{
			Name:    ServerName,
			Version: ServerVersion,
		},
	}

	return s.successResponse(req.ID, result)
}

// handleInitialized handles the initialized notification
func (s *Server) handleInitialized(req JSONRPCRequest) ([]byte, error) {
	s.initialized = true
	log.Println("Server initialized")
	// Notifications don't need a response
	return nil, nil
}

// handleListTools handles the tools/list request
func (s *Server) handleListTools(req JSONRPCRequest) ([]byte, error) {
	if !s.initialized {
		return s.errorResponse(req.ID, -32002, "Server not initialized", nil)
	}

	tools := make([]Tool, 0, len(s.tools))
	for _, tool := range s.tools {
		tools = append(tools, tool)
	}

	result := ListToolsResult{
		Tools: tools,
	}

	return s.successResponse(req.ID, result)
}

// handleCallTool handles the tools/call request
func (s *Server) handleCallTool(req JSONRPCRequest) ([]byte, error) {
	if !s.initialized {
		return s.errorResponse(req.ID, -32002, "Server not initialized", nil)
	}

	// Parse params
	paramsBytes, err := json.Marshal(req.Params)
	if err != nil {
		return s.errorResponse(req.ID, -32603, "Internal error", err.Error())
	}

	var params CallToolParams
	if err := json.Unmarshal(paramsBytes, &params); err != nil {
		return s.errorResponse(req.ID, -32602, "Invalid params", err.Error())
	}

	// Find tool handler
	handler, exists := s.toolHandlers[params.Name]
	if !exists {
		return s.errorResponse(req.ID, -32602, fmt.Sprintf("Tool not found: %s", params.Name), nil)
	}

	// Execute tool
	result, err := handler(params.Arguments)
	if err != nil {
		return s.errorResponse(req.ID, -32603, fmt.Sprintf("Tool execution error: %s", err.Error()), nil)
	}

	// Format result
	resultJSON, err := json.Marshal(result)
	if err != nil {
		return s.errorResponse(req.ID, -32603, "Failed to marshal result", err.Error())
	}

	toolResult := CallToolResult{
		Content: []Content{
			{
				Type: "text",
				Text: string(resultJSON),
			},
		},
	}

	return s.successResponse(req.ID, toolResult)
}

// handlePing handles the ping request
func (s *Server) handlePing(req JSONRPCRequest) ([]byte, error) {
	return s.successResponse(req.ID, map[string]interface{}{
		"status": "ok",
	})
}

// successResponse creates a success JSON-RPC response
func (s *Server) successResponse(id interface{}, result interface{}) ([]byte, error) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Result:  result,
	}
	return json.Marshal(resp)
}

// errorResponse creates an error JSON-RPC response
func (s *Server) errorResponse(id interface{}, code int, message string, data interface{}) ([]byte, error) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &JSONRPCError{
			Code:    code,
			Message: message,
			Data:    data,
		},
	}
	return json.Marshal(resp)
}

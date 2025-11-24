package main

import (
	"log"
	"os"

	"github.com/martians-sheep/remote-mcpserver-sample/go/internal/mcp"
	"github.com/martians-sheep/remote-mcpserver-sample/go/internal/tools"
)

func main() {
	// Set up logging to stderr (stdout is used for MCP protocol)
	log.SetOutput(os.Stderr)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// Create MCP server
	server := mcp.NewServer()

	// Register tools
	registerTools(server)

	// Create stdio transport
	transport := mcp.NewStdioTransport(server)

	// Start server
	if err := transport.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

func registerTools(server *mcp.Server) {
	// Calculator
	server.RegisterTool(mcp.Tool{
		Name:        "calculator",
		Description: "Perform basic arithmetic operations (add, subtract, multiply, divide)",
		InputSchema: tools.GetCalculatorSchema(),
	}, tools.Calculator)

	// Storage operations
	server.RegisterTool(mcp.Tool{
		Name:        "storage_set",
		Description: "Store a key-value pair in memory",
		InputSchema: tools.GetStorageSetSchema(),
	}, tools.StorageSet)

	server.RegisterTool(mcp.Tool{
		Name:        "storage_get",
		Description: "Retrieve a value by key from memory",
		InputSchema: tools.GetStorageGetSchema(),
	}, tools.StorageGet)

	server.RegisterTool(mcp.Tool{
		Name:        "storage_delete",
		Description: "Delete a key-value pair from memory",
		InputSchema: tools.GetStorageDeleteSchema(),
	}, tools.StorageDelete)

	server.RegisterTool(mcp.Tool{
		Name:        "storage_list",
		Description: "List all stored keys",
		InputSchema: tools.GetStorageListSchema(),
	}, tools.StorageList)

	// System info
	server.RegisterTool(mcp.Tool{
		Name:        "system_info",
		Description: "Get system information about the Go runtime",
		InputSchema: tools.GetSystemInfoSchema(),
	}, tools.SystemInfo)

	// Echo
	server.RegisterTool(mcp.Tool{
		Name:        "echo",
		Description: "Echo back a message (for testing)",
		InputSchema: tools.GetEchoSchema(),
	}, tools.Echo)

	log.Println("Registered 7 tools")
}

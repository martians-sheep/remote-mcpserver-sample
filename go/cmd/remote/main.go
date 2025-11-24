package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/martians-sheep/remote-mcpserver-sample/go/internal/mcp"
	"github.com/martians-sheep/remote-mcpserver-sample/go/internal/tools"
)

var (
	apiKey string
	port   string
)

func main() {
	// Load .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Get configuration from environment
	apiKey = os.Getenv("MCP_API_KEY")
	if apiKey == "" {
		log.Fatal("MCP_API_KEY environment variable is required")
	}

	port = os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Create MCP server
	server := mcp.NewServer()

	// Register tools
	registerTools(server)

	// Create Gin router
	router := gin.Default()

	// CORS middleware
	router.Use(corsMiddleware())

	// Rate limiting middleware
	router.Use(rateLimitMiddleware())

	// Health check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"server": "go-mcp-server",
		})
	})

	// SSE endpoint
	router.GET("/sse", authMiddleware(), func(c *gin.Context) {
		if err := mcp.HandleSSERequest(server, c.Writer, c.Request, "/message"); err != nil {
			log.Printf("SSE error: %v", err)
		}
	})

	// Message endpoint
	router.POST("/message", authMiddleware(), func(c *gin.Context) {
		if err := mcp.HandleMessagePost(server, c.Writer, c.Request); err != nil {
			log.Printf("Message error: %v", err)
		}
	})

	// Start server
	addr := fmt.Sprintf(":%s", port)
	log.Printf("Starting Go MCP Server on %s", addr)
	log.Printf("SSE endpoint: http://localhost:%s/sse", port)
	log.Printf("Message endpoint: http://localhost:%s/message", port)

	if err := router.Run(addr); err != nil {
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

// authMiddleware validates the API key
func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Missing Authorization header"})
			c.Abort()
			return
		}

		// Check for Bearer token
		if !strings.HasPrefix(auth, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid Authorization header format"})
			c.Abort()
			return
		}

		token := strings.TrimPrefix(auth, "Bearer ")
		if token != apiKey {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid API key"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// corsMiddleware adds CORS headers
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		corsOrigin := os.Getenv("CORS_ORIGIN")
		if corsOrigin == "" {
			corsOrigin = "*"
		}

		c.Writer.Header().Set("Access-Control-Allow-Origin", corsOrigin)
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

// rateLimitMiddleware implements simple rate limiting
func rateLimitMiddleware() gin.HandlerFunc {
	type client struct {
		lastSeen time.Time
		count    int
	}

	clients := make(map[string]*client)
	var mu sync.Mutex

	return func(c *gin.Context) {
		mu.Lock()
		defer mu.Unlock()

		ip := c.ClientIP()
		now := time.Now()

		cl, exists := clients[ip]
		if !exists {
			clients[ip] = &client{
				lastSeen: now,
				count:    1,
			}
			c.Next()
			return
		}

		// Reset count if more than 1 minute has passed
		if now.Sub(cl.lastSeen) > time.Minute {
			cl.count = 1
			cl.lastSeen = now
			c.Next()
			return
		}

		// Check rate limit (default: 100 requests per minute)
		rateLimit := 100
		if limit := os.Getenv("RATE_LIMIT"); limit != "" {
			fmt.Sscanf(limit, "%d", &rateLimit)
		}

		if cl.count >= rateLimit {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "Rate limit exceeded"})
			c.Abort()
			return
		}

		cl.count++
		c.Next()
	}
}

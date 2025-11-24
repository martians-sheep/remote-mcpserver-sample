.PHONY: all build clean local remote test install

# Variables
BINARY_DIR=bin
LOCAL_BINARY=$(BINARY_DIR)/local-server
REMOTE_BINARY=$(BINARY_DIR)/remote-server

# Build all binaries
all: build

# Build both servers
build: local remote

# Build local server (stdio)
local:
	@echo "Building local MCP server..."
	@mkdir -p $(BINARY_DIR)
	go build -o $(LOCAL_BINARY) ./cmd/local

# Build remote server (HTTP/SSE)
remote:
	@echo "Building remote MCP server..."
	@mkdir -p $(BINARY_DIR)
	go build -o $(REMOTE_BINARY) ./cmd/remote

# Run local server
run-local: local
	@echo "Running local MCP server..."
	@$(LOCAL_BINARY)

# Run remote server
run-remote: remote
	@echo "Running remote MCP server..."
	@$(REMOTE_BINARY)

# Run tests
test:
	@echo "Running tests..."
	go test -v ./...

# Run tests with coverage
test-coverage:
	@echo "Running tests with coverage..."
	go test -cover ./...

# Install dependencies
install:
	@echo "Installing dependencies..."
	go mod download

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	@rm -rf $(BINARY_DIR)

# Build for multiple platforms
build-all:
	@echo "Building for multiple platforms..."
	@mkdir -p $(BINARY_DIR)
	GOOS=linux GOARCH=amd64 go build -o $(BINARY_DIR)/local-server-linux-amd64 ./cmd/local
	GOOS=linux GOARCH=arm64 go build -o $(BINARY_DIR)/local-server-linux-arm64 ./cmd/local
	GOOS=darwin GOARCH=amd64 go build -o $(BINARY_DIR)/local-server-darwin-amd64 ./cmd/local
	GOOS=darwin GOARCH=arm64 go build -o $(BINARY_DIR)/local-server-darwin-arm64 ./cmd/local
	GOOS=windows GOARCH=amd64 go build -o $(BINARY_DIR)/local-server-windows-amd64.exe ./cmd/local
	GOOS=linux GOARCH=amd64 go build -o $(BINARY_DIR)/remote-server-linux-amd64 ./cmd/remote
	GOOS=linux GOARCH=arm64 go build -o $(BINARY_DIR)/remote-server-linux-arm64 ./cmd/remote
	GOOS=darwin GOARCH=amd64 go build -o $(BINARY_DIR)/remote-server-darwin-amd64 ./cmd/remote
	GOOS=darwin GOARCH=arm64 go build -o $(BINARY_DIR)/remote-server-darwin-arm64 ./cmd/remote
	GOOS=windows GOARCH=amd64 go build -o $(BINARY_DIR)/remote-server-windows-amd64.exe ./cmd/remote
	@echo "Done building for multiple platforms"

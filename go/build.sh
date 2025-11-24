#!/bin/bash

# Build script for Go MCP Server

set -e

echo "Building Go MCP Server..."

# Create bin directory
mkdir -p bin

# Build local server
echo "Building local server..."
go build -o bin/local-server ./cmd/local

# Build remote server
echo "Building remote server..."
go build -o bin/remote-server ./cmd/remote

echo "Build complete!"
echo "Local server: bin/local-server"
echo "Remote server: bin/remote-server"

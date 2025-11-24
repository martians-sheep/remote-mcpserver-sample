# Build stage
FROM rust:1.75 AS builder

WORKDIR /app

# Copy manifests
COPY Cargo.toml ./
COPY mcp-core/Cargo.toml ./mcp-core/
COPY mcp-local/Cargo.toml ./mcp-local/
COPY mcp-remote/Cargo.toml ./mcp-remote/

# Copy source code
COPY mcp-core/src ./mcp-core/src/
COPY mcp-remote/src ./mcp-remote/src/

# Build for release
RUN cargo build --release --bin mcp-remote

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/target/release/mcp-remote .

# Expose port
EXPOSE 8080

# Run the server
CMD ["./mcp-remote"]

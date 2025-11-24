use mcp_core::McpServer;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing (log to stderr since stdout is used for MCP protocol)
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .init();

    tracing::info!("MCP Server (stdio) starting...");

    let mut server = McpServer::new();

    let stdin = tokio::io::stdin();
    let mut stdout = tokio::io::stdout();
    let mut reader = BufReader::new(stdin);

    loop {
        let mut line = String::new();
        let n = reader.read_line(&mut line).await?;

        // EOF reached
        if n == 0 {
            tracing::info!("EOF received, shutting down");
            break;
        }

        let line = line.trim();

        // Skip empty lines
        if line.is_empty() {
            continue;
        }

        tracing::debug!("Received: {}", line);

        // Handle request
        match server.handle_request(line).await {
            Ok(Some(response)) => {
                tracing::debug!("Sending: {}", response);
                stdout.write_all(response.as_bytes()).await?;
                stdout.write_all(b"\n").await?;
                stdout.flush().await?;
            }
            Ok(None) => {
                // Notification, no response needed
                tracing::debug!("Handled notification");
            }
            Err(e) => {
                tracing::error!("Error handling request: {}", e);
            }
        }
    }

    Ok(())
}

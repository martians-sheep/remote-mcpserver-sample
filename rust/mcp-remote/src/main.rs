use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse, Response,
    },
    routing::{get, post},
    Json, Router,
};
use futures::stream::{self, Stream};
use mcp_core::McpServer;
use serde_json::json;
use std::convert::Infallible;
use std::sync::Arc;
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};

#[derive(Clone)]
struct AppState {
    api_key: String,
    server: Arc<Mutex<McpServer>>,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt().init();

    // Load environment variables
    dotenv::dotenv().ok();

    let api_key = std::env::var("MCP_API_KEY")
        .expect("MCP_API_KEY environment variable is required");

    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()?;

    let server = Arc::new(Mutex::new(McpServer::new()));

    let state = AppState { api_key, server };

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // Build router
    let app = Router::new()
        .route("/health", get(health))
        .route("/sse", get(sse_handler))
        .route("/message", post(message_handler))
        .layer(cors)
        .with_state(state);

    let addr = format!("0.0.0.0:{}", port);
    tracing::info!("Starting Rust MCP Server on {}", addr);
    tracing::info!("SSE endpoint: http://localhost:{}/sse", port);
    tracing::info!("Message endpoint: http://localhost:{}/message", port);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health() -> Json<serde_json::Value> {
    Json(json!({
        "status": "ok",
        "server": "rust-mcp-server"
    }))
}

async fn sse_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Sse<impl Stream<Item = Result<Event, Infallible>>>, Response> {
    // Check authentication
    if let Some(auth) = headers.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if !auth_str.starts_with("Bearer ") || &auth_str[7..] != state.api_key {
                return Err((StatusCode::UNAUTHORIZED, "Invalid API key").into_response());
            }
        } else {
            return Err((StatusCode::UNAUTHORIZED, "Invalid Authorization header")
                .into_response());
        }
    } else {
        return Err(
            (StatusCode::UNAUTHORIZED, "Missing Authorization header").into_response()
        );
    }

    tracing::info!("SSE connection established");

    // Send endpoint event
    let endpoint_event = Event::default()
        .event("endpoint")
        .data("/message");

    let stream = stream::once(async move { Ok(endpoint_event) });

    Ok(Sse::new(stream).keep_alive(KeepAlive::default()))
}

async fn message_handler(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: String,
) -> Result<Json<serde_json::Value>, Response> {
    // Check authentication
    if let Some(auth) = headers.get("authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if !auth_str.starts_with("Bearer ") || &auth_str[7..] != state.api_key {
                return Err((StatusCode::UNAUTHORIZED, "Invalid API key").into_response());
            }
        } else {
            return Err((StatusCode::UNAUTHORIZED, "Invalid Authorization header")
                .into_response());
        }
    } else {
        return Err(
            (StatusCode::UNAUTHORIZED, "Missing Authorization header").into_response()
        );
    }

    let mut server = state.server.lock().await;

    match server.handle_request(&body).await {
        Ok(Some(response)) => {
            let json_response: serde_json::Value = serde_json::from_str(&response)
                .map_err(|e| {
                    (
                        StatusCode::INTERNAL_SERVER_ERROR,
                        format!("Failed to parse response: {}", e),
                    )
                        .into_response()
                })?;
            Ok(Json(json_response))
        }
        Ok(None) => {
            // Notification, no response
            Err(StatusCode::NO_CONTENT.into_response())
        }
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Error: {}", e),
        )
            .into_response()),
    }
}

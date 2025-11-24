use crate::tools::{get_all_tools, ToolHandler};
use crate::types::*;
use anyhow::Result;
use serde_json::json;
use std::collections::HashMap;
use std::sync::Arc;

const PROTOCOL_VERSION: &str = "2024-11-05";
const SERVER_NAME: &str = "rust-mcp-server";
const SERVER_VERSION: &str = "1.0.0";

pub struct McpServer {
    tools: HashMap<String, Arc<Box<dyn ToolHandler>>>,
    initialized: bool,
}

impl McpServer {
    pub fn new() -> Self {
        let mut tools_map = HashMap::new();

        for tool in get_all_tools() {
            let tool_arc = Arc::new(tool);
            tools_map.insert(tool_arc.definition().name.clone(), tool_arc);
        }

        tracing::info!("Registered {} tools", tools_map.len());

        Self {
            tools: tools_map,
            initialized: false,
        }
    }

    pub async fn handle_request(&mut self, request_data: &str) -> Result<Option<String>> {
        let request: JsonRpcRequest = serde_json::from_str(request_data)?;

        let response = match request.method.as_str() {
            "initialize" => Some(self.handle_initialize(request)?),
            "initialized" => {
                self.handle_initialized(request)?;
                None // Notification, no response
            }
            "tools/list" => Some(self.handle_list_tools(request)?),
            "tools/call" => Some(self.handle_call_tool(request).await?),
            "ping" => Some(self.handle_ping(request)?),
            _ => Some(JsonRpcResponse::error(
                request.id,
                -32601,
                format!("Method not found: {}", request.method),
            )),
        };

        Ok(response.map(|r| serde_json::to_string(&r).unwrap()))
    }

    fn handle_initialize(&mut self, request: JsonRpcRequest) -> Result<JsonRpcResponse> {
        let result = InitializeResult {
            protocol_version: PROTOCOL_VERSION.to_string(),
            capabilities: {
                let mut caps = HashMap::new();
                caps.insert("tools".to_string(), json!({}));
                caps
            },
            server_info: ServerInfo {
                name: SERVER_NAME.to_string(),
                version: SERVER_VERSION.to_string(),
            },
        };

        Ok(JsonRpcResponse::success(
            request.id,
            serde_json::to_value(result)?,
        ))
    }

    fn handle_initialized(&mut self, _request: JsonRpcRequest) -> Result<()> {
        self.initialized = true;
        tracing::info!("Server initialized");
        Ok(())
    }

    fn handle_list_tools(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse> {
        if !self.initialized {
            return Ok(JsonRpcResponse::error(
                request.id,
                -32002,
                "Server not initialized".to_string(),
            ));
        }

        let tools: Vec<Tool> = self
            .tools
            .values()
            .map(|handler| handler.definition())
            .collect();

        let result = ListToolsResult { tools };

        Ok(JsonRpcResponse::success(
            request.id,
            serde_json::to_value(result)?,
        ))
    }

    async fn handle_call_tool(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse> {
        if !self.initialized {
            return Ok(JsonRpcResponse::error(
                request.id,
                -32002,
                "Server not initialized".to_string(),
            ));
        }

        let params: CallToolParams = serde_json::from_value(
            request
                .params
                .ok_or_else(|| anyhow::anyhow!("Missing params"))?,
        )?;

        let handler = self.tools.get(&params.name).ok_or_else(|| {
            anyhow::anyhow!("Tool not found: {}", params.name)
        })?;

        match handler.execute(params.arguments).await {
            Ok(result) => {
                let result_json = serde_json::to_string(&result)?;

                let tool_result = CallToolResult {
                    content: vec![Content {
                        content_type: "text".to_string(),
                        text: result_json,
                    }],
                };

                Ok(JsonRpcResponse::success(
                    request.id,
                    serde_json::to_value(tool_result)?,
                ))
            }
            Err(e) => Ok(JsonRpcResponse::error(
                request.id,
                -32603,
                format!("Tool execution error: {}", e),
            )),
        }
    }

    fn handle_ping(&self, request: JsonRpcRequest) -> Result<JsonRpcResponse> {
        Ok(JsonRpcResponse::success(
            request.id,
            json!({ "status": "ok" }),
        ))
    }
}

impl Default for McpServer {
    fn default() -> Self {
        Self::new()
    }
}

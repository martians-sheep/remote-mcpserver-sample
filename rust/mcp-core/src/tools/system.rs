use super::ToolHandler;
use crate::types::Tool;
use anyhow::Result;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::time::SystemTime;

lazy_static::lazy_static! {
    static ref START_TIME: SystemTime = SystemTime::now();
}

pub struct SystemInfoTool;

#[async_trait::async_trait]
impl ToolHandler for SystemInfoTool {
    fn definition(&self) -> Tool {
        Tool {
            name: "system_info".to_string(),
            description: "Get system information about the Rust runtime".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {}
            }),
        }
    }

    async fn execute(&self, _args: HashMap<String, Value>) -> Result<Value> {
        let uptime = START_TIME.elapsed().unwrap_or_default();

        Ok(json!({
            "platform": std::env::consts::OS,
            "architecture": std::env::consts::ARCH,
            "rustVersion": env!("CARGO_PKG_RUST_VERSION", "unknown"),
            "uptime": format!("{:?}", uptime),
            "serverType": "Rust MCP Server",
            "timestamp": chrono::Utc::now().to_rfc3339(),
        }))
    }
}

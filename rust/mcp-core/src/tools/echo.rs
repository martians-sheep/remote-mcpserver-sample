use super::ToolHandler;
use crate::types::Tool;
use anyhow::{anyhow, Result};
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct EchoInput {
    message: String,
}

pub struct EchoTool;

#[async_trait::async_trait]
impl ToolHandler for EchoTool {
    fn definition(&self) -> Tool {
        Tool {
            name: "echo".to_string(),
            description: "Echo back a message (for testing)".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The message to echo back"
                    }
                },
                "required": ["message"]
            }),
        }
    }

    async fn execute(&self, args: HashMap<String, Value>) -> Result<Value> {
        let input: EchoInput = serde_json::from_value(json!(args))?;

        if input.message.is_empty() {
            return Err(anyhow!("Message is required"));
        }

        Ok(json!({
            "echo": input.message,
            "length": input.message.len(),
            "timestamp": chrono::Utc::now().to_rfc3339(),
        }))
    }
}

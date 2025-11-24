use super::ToolHandler;
use crate::types::Tool;
use anyhow::{anyhow, Result};
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

lazy_static::lazy_static! {
    static ref STORAGE: Arc<RwLock<HashMap<String, String>>> = Arc::new(RwLock::new(HashMap::new()));
}

// Storage Set Tool
#[derive(Debug, Deserialize)]
struct StorageSetInput {
    key: String,
    value: String,
}

pub struct StorageSetTool;

#[async_trait::async_trait]
impl ToolHandler for StorageSetTool {
    fn definition(&self) -> Tool {
        Tool {
            name: "storage_set".to_string(),
            description: "Store a key-value pair in memory".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "The key to store the value under"
                    },
                    "value": {
                        "type": "string",
                        "description": "The value to store"
                    }
                },
                "required": ["key", "value"]
            }),
        }
    }

    async fn execute(&self, args: HashMap<String, Value>) -> Result<Value> {
        let input: StorageSetInput = serde_json::from_value(json!(args))?;

        if input.key.is_empty() {
            return Err(anyhow!("Key is required"));
        }

        let mut storage = STORAGE.write().await;
        storage.insert(input.key.clone(), input.value);

        Ok(json!({
            "success": true,
            "message": format!("Stored value for key '{}'", input.key)
        }))
    }
}

// Storage Get Tool
#[derive(Debug, Deserialize)]
struct StorageGetInput {
    key: String,
}

pub struct StorageGetTool;

#[async_trait::async_trait]
impl ToolHandler for StorageGetTool {
    fn definition(&self) -> Tool {
        Tool {
            name: "storage_get".to_string(),
            description: "Retrieve a value by key from memory".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "The key to retrieve"
                    }
                },
                "required": ["key"]
            }),
        }
    }

    async fn execute(&self, args: HashMap<String, Value>) -> Result<Value> {
        let input: StorageGetInput = serde_json::from_value(json!(args))?;

        if input.key.is_empty() {
            return Err(anyhow!("Key is required"));
        }

        let storage = STORAGE.read().await;

        match storage.get(&input.key) {
            Some(value) => Ok(json!({
                "found": true,
                "key": input.key,
                "value": value
            })),
            None => Ok(json!({
                "found": false,
                "key": input.key
            })),
        }
    }
}

// Storage Delete Tool
#[derive(Debug, Deserialize)]
struct StorageDeleteInput {
    key: String,
}

pub struct StorageDeleteTool;

#[async_trait::async_trait]
impl ToolHandler for StorageDeleteTool {
    fn definition(&self) -> Tool {
        Tool {
            name: "storage_delete".to_string(),
            description: "Delete a key-value pair from memory".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "The key to delete"
                    }
                },
                "required": ["key"]
            }),
        }
    }

    async fn execute(&self, args: HashMap<String, Value>) -> Result<Value> {
        let input: StorageDeleteInput = serde_json::from_value(json!(args))?;

        if input.key.is_empty() {
            return Err(anyhow!("Key is required"));
        }

        let mut storage = STORAGE.write().await;

        match storage.remove(&input.key) {
            Some(_) => Ok(json!({
                "success": true,
                "message": format!("Deleted key '{}'", input.key)
            })),
            None => Ok(json!({
                "success": false,
                "message": format!("Key '{}' not found", input.key)
            })),
        }
    }
}

// Storage List Tool
pub struct StorageListTool;

#[async_trait::async_trait]
impl ToolHandler for StorageListTool {
    fn definition(&self) -> Tool {
        Tool {
            name: "storage_list".to_string(),
            description: "List all stored keys".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {}
            }),
        }
    }

    async fn execute(&self, _args: HashMap<String, Value>) -> Result<Value> {
        let storage = STORAGE.read().await;
        let keys: Vec<String> = storage.keys().cloned().collect();

        Ok(json!({
            "keys": keys,
            "count": keys.len()
        }))
    }
}

pub mod calculator;
pub mod echo;
pub mod storage;
pub mod system;

use crate::types::Tool;
use anyhow::Result;
use serde_json::Value;
use std::collections::HashMap;

#[async_trait::async_trait]
pub trait ToolHandler: Send + Sync {
    fn definition(&self) -> Tool;
    async fn execute(&self, args: HashMap<String, Value>) -> Result<Value>;
}

pub fn get_all_tools() -> Vec<Box<dyn ToolHandler>> {
    vec![
        Box::new(calculator::CalculatorTool),
        Box::new(storage::StorageSetTool),
        Box::new(storage::StorageGetTool),
        Box::new(storage::StorageDeleteTool),
        Box::new(storage::StorageListTool),
        Box::new(system::SystemInfoTool),
        Box::new(echo::EchoTool),
    ]
}

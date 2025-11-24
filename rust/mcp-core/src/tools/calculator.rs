use super::ToolHandler;
use crate::types::Tool;
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct CalculatorInput {
    operation: String,
    a: f64,
    b: f64,
}

#[derive(Debug, Serialize)]
struct CalculatorResult {
    result: f64,
    operation: String,
}

pub struct CalculatorTool;

#[async_trait::async_trait]
impl ToolHandler for CalculatorTool {
    fn definition(&self) -> Tool {
        Tool {
            name: "calculator".to_string(),
            description: "Perform basic arithmetic operations (add, subtract, multiply, divide)".to_string(),
            input_schema: json!({
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["add", "subtract", "multiply", "divide"],
                        "description": "The arithmetic operation to perform"
                    },
                    "a": {
                        "type": "number",
                        "description": "First operand"
                    },
                    "b": {
                        "type": "number",
                        "description": "Second operand"
                    }
                },
                "required": ["operation", "a", "b"]
            }),
        }
    }

    async fn execute(&self, args: HashMap<String, Value>) -> Result<Value> {
        let input: CalculatorInput = serde_json::from_value(json!(args))?;

        let result = match input.operation.as_str() {
            "add" => input.a + input.b,
            "subtract" => input.a - input.b,
            "multiply" => input.a * input.b,
            "divide" => {
                if input.b == 0.0 {
                    return Err(anyhow!("Division by zero"));
                }
                input.a / input.b
            }
            _ => return Err(anyhow!("Unsupported operation: {}", input.operation)),
        };

        Ok(json!(CalculatorResult {
            result,
            operation: format!("{} {} {} = {}", input.a, input.operation, input.b, result),
        }))
    }
}

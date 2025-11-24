"""
計算機ツール
ローカル・リモート両方で使用する共通実装
"""

from typing import Literal
from pydantic import BaseModel


class CalculatorInput(BaseModel):
    """計算機の入力"""

    operation: Literal["add", "subtract", "multiply", "divide"]
    a: float
    b: float


class CalculatorResult(BaseModel):
    """計算機の結果"""

    result: float
    operation: str


def calculate(params: CalculatorInput) -> CalculatorResult:
    """計算を実行"""
    a, b = params.a, params.b

    if params.operation == "add":
        result = a + b
    elif params.operation == "subtract":
        result = a - b
    elif params.operation == "multiply":
        result = a * b
    elif params.operation == "divide":
        if b == 0:
            raise ValueError("Division by zero is not allowed")
        result = a / b
    else:
        raise ValueError(f"Unknown operation: {params.operation}")

    return CalculatorResult(
        result=result, operation=f"{a} {params.operation} {b} = {result}"
    )


# MCP Tool Definition
calculator_tool = {
    "name": "calculator",
    "description": "Perform basic arithmetic operations (add, subtract, multiply, divide)",
    "inputSchema": {
        "type": "object",
        "properties": {
            "operation": {
                "type": "string",
                "enum": ["add", "subtract", "multiply", "divide"],
                "description": "The arithmetic operation to perform",
            },
            "a": {"type": "number", "description": "The first number"},
            "b": {"type": "number", "description": "The second number"},
        },
        "required": ["operation", "a", "b"],
    },
}

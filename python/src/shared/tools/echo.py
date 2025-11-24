"""
エコーツール（デバッグ用）
ローカル・リモート両方で使用する共通実装
"""

from datetime import datetime
from pydantic import BaseModel


class EchoInput(BaseModel):
    """エコー入力"""

    message: str


class EchoResult(BaseModel):
    """エコー結果"""

    echo: str
    timestamp: str
    length: int


def echo(message: str) -> EchoResult:
    """メッセージをエコーバック"""
    return EchoResult(
        echo=message, timestamp=datetime.utcnow().isoformat(), length=len(message)
    )


# MCP Tool Definition
echo_tool = {
    "name": "echo",
    "description": "Echo back a message with timestamp (useful for testing)",
    "inputSchema": {
        "type": "object",
        "properties": {
            "message": {
                "type": "string",
                "description": "The message to echo back",
            }
        },
        "required": ["message"],
    },
}

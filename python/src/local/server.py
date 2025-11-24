#!/usr/bin/env python3
"""
ローカルMCPサーバー（stdio版）

特徴:
- stdioを通じた通信（プロセス間通信）
- 認証不要（ローカル実行のため）
- シンプルな起動方法
- Claude Desktopから直接プロセスとして起動される
"""

import asyncio
import logging
import sys
from typing import Any

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

# 共通ツールのインポート
sys.path.insert(0, str(__file__).rsplit("/", 3)[0])
from src.shared.tools import (
    calculate,
    calculator_tool,
    SimpleStorage,
    storage_tools,
    get_system_info,
    system_info_tool,
    echo,
    echo_tool,
    CalculatorInput,
    EchoInput,
)

# ロガー設定
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    stream=sys.stderr,
)
logger = logging.getLogger(__name__)

# ストレージのインスタンス
storage = SimpleStorage()

# MCPサーバーの作成
app = Server("local-mcp-server-python")


@app.list_tools()
async def list_tools() -> list[Tool]:
    """利用可能なツールを一覧"""
    return [
        Tool(**calculator_tool),
        Tool(**storage_tools["set"]),
        Tool(**storage_tools["get"]),
        Tool(**storage_tools["delete"]),
        Tool(**storage_tools["list"]),
        Tool(**system_info_tool),
        Tool(**echo_tool),
    ]


@app.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """ツールを実行"""
    try:
        if name == "calculator":
            params = CalculatorInput(**arguments)
            result = calculate(params)
            return [TextContent(type="text", text=result.model_dump_json(indent=2))]

        elif name == "storage_set":
            key = arguments["key"]
            value = arguments["value"]
            result = storage.set(key, value)
            return [TextContent(type="text", text=result.model_dump_json(indent=2))]

        elif name == "storage_get":
            key = arguments["key"]
            result = storage.get(key)
            if result is None:
                return [TextContent(type="text", text='{"error": "Key not found"}')]
            return [TextContent(type="text", text=result.model_dump_json(indent=2))]

        elif name == "storage_delete":
            key = arguments["key"]
            deleted = storage.delete(key)
            return [
                TextContent(
                    type="text", text=f'{{"deleted": {str(deleted).lower()}, "key": "{key}"}}'
                )
            ]

        elif name == "storage_list":
            items = storage.list()
            result = {"items": [item.model_dump() for item in items], "count": len(items)}
            import json

            return [TextContent(type="text", text=json.dumps(result, indent=2))]

        elif name == "system_info":
            info = get_system_info()
            import json

            return [TextContent(type="text", text=json.dumps(info, indent=2))]

        elif name == "echo":
            params = EchoInput(**arguments)
            result = echo(params.message)
            return [TextContent(type="text", text=result.model_dump_json(indent=2))]

        else:
            return [TextContent(type="text", text=f'{{"error": "Unknown tool: {name}"}}')]

    except Exception as e:
        logger.error(f"Error executing tool {name}: {e}", exc_info=True)
        return [TextContent(type="text", text=f'{{"error": "{str(e)}"}}')]


async def main() -> None:
    """メイン関数"""
    logger.info("Starting Local MCP Server (stdio) - Python")
    logger.info("Communication: stdio")
    logger.info("Authentication: None (local execution)")

    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())


if __name__ == "__main__":
    asyncio.run(main())

#!/usr/bin/env python3
"""
リモートMCPサーバー（FastAPI版）

特徴:
- HTTP/SSEを通じた通信
- APIキー認証が必要
- CORS設定が必要
- Uvicornで実行
- 環境変数による設定
"""

import json
import logging
import os
import sys
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sse_starlette.sse import EventSourceResponse

from mcp.server import Server
from mcp.server.sse import SseServerTransport
from mcp.types import Tool, TextContent

# 共通ツールのインポート
sys.path.insert(0, str(__file__).rsplit("/", 4)[0])
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

# 環境変数の読み込み
load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
API_KEY = os.getenv("API_KEY", "")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# ロガー設定
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="[%(asctime)s] %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

# FastAPIアプリの作成
app = FastAPI(
    title="Remote MCP Server (FastAPI)",
    version="1.0.0",
    description="Remote MCP Server implementation using FastAPI and SSE",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ストレージのインスタンス
storage = SimpleStorage()


def validate_api_key(authorization: Optional[str] = None) -> bool:
    """APIキーを検証"""
    if not API_KEY:
        return True  # APIキーが設定されていない場合はスキップ

    if not authorization:
        return False

    # Bearer トークンを抽出
    if authorization.startswith("Bearer "):
        token = authorization[7:]
        return token == API_KEY

    return False


def create_mcp_server() -> Server:
    """MCPサーバーのインスタンスを作成"""
    server = Server("remote-mcp-server-fastapi")

    @server.list_tools()
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

    @server.call_tool()
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
                        type="text",
                        text=f'{{"deleted": {str(deleted).lower()}, "key": "{key}"}}',
                    )
                ]

            elif name == "storage_list":
                items = storage.list()
                result = {"items": [item.model_dump() for item in items], "count": len(items)}
                return [TextContent(type="text", text=json.dumps(result, indent=2))]

            elif name == "system_info":
                info = get_system_info()
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

    return server


@app.get("/")
async def root():
    """ルートエンドポイント"""
    return {
        "name": "Remote MCP Server (FastAPI)",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "metrics": "/metrics",
            "sse": "/sse",
        },
        "authentication": "Bearer token required" if API_KEY else "Disabled",
        "documentation": "https://github.com/modelcontextprotocol",
    }


@app.get("/health")
async def health():
    """ヘルスチェックエンドポイント"""
    import datetime

    return {
        "status": "healthy",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "version": "1.0.0",
    }


@app.get("/metrics")
async def metrics(authorization: Optional[str] = Header(None)):
    """メトリクスエンドポイント"""
    if not validate_api_key(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    return {
        "storage_items": storage.size(),
    }


@app.get("/sse")
async def sse_endpoint(request: Request, authorization: Optional[str] = Header(None)):
    """SSEエンドポイント"""
    logger.info("New SSE connection request")

    # 認証チェック
    if not validate_api_key(authorization):
        logger.warning("Unauthorized SSE connection attempt")
        raise HTTPException(status_code=401, detail="Unauthorized")

    logger.info("SSE connection authenticated")

    # MCPサーバーのインスタンスを作成
    mcp_server = create_mcp_server()

    # SSEトランスポートの設定
    async def event_generator():
        async with SseServerTransport("/message") as transport:
            await mcp_server.run(
                transport.read_stream,
                transport.write_stream,
                mcp_server.create_initialization_options(),
            )

    return EventSourceResponse(event_generator())


@app.post("/message")
async def message_endpoint(request: Request, authorization: Optional[str] = Header(None)):
    """メッセージエンドポイント"""
    if not validate_api_key(authorization):
        raise HTTPException(status_code=401, detail="Unauthorized")

    # SSEトランスポートがメッセージを処理
    return JSONResponse(content={"status": "ok"})


if __name__ == "__main__":
    import uvicorn

    if not API_KEY:
        logger.warning("WARNING: API_KEY is not set. Authentication is disabled.")
        logger.warning("Set API_KEY in .env file for production use.")

    logger.info("=" * 60)
    logger.info("Remote MCP Server (FastAPI) is starting")
    logger.info("=" * 60)
    logger.info(f"Port: {PORT}")
    logger.info("Communication: HTTP/SSE")
    logger.info(f"Authentication: {'Enabled (API Key)' if API_KEY else 'Disabled'}")
    logger.info(f"CORS Origins: {', '.join(ALLOWED_ORIGINS)}")
    logger.info(f"Health check: http://localhost:{PORT}/health")
    logger.info(f"SSE endpoint: http://localhost:{PORT}/sse")
    logger.info("=" * 60)

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=PORT,
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )

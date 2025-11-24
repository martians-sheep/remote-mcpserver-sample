#!/usr/bin/env python3
"""
リモートMCPクライアント（Python版）
HTTP/SSE経由でリモートMCPサーバーに接続
"""

import asyncio
import json
import os
from dotenv import load_dotenv
from mcp.client import Client
from mcp.client.sse import sse_client

load_dotenv()

REMOTE_SERVER_URL = os.getenv("REMOTE_SERVER_URL", "http://localhost:8000/sse")
API_KEY = os.getenv("API_KEY", "")


async def main():
    print("🌐 リモートMCPサーバーに接続中...")
    print(f"URL: {REMOTE_SERVER_URL}\n")

    if not API_KEY:
        print("⚠️  警告: API_KEYが設定されていません\n")

    headers = {"Authorization": f"Bearer {API_KEY}"} if API_KEY else {}

    async with sse_client(REMOTE_SERVER_URL, headers=headers) as (read, write):
        async with Client(read, write) as client:
            await client.initialize()
            print("✅ 接続成功！\n")

            # 利用可能なツールを取得
            tools_result = await client.list_tools()
            print("📋 利用可能なツール:")
            for tool in tools_result.tools:
                print(f"  - {tool.name}: {tool.description}")
            print()

            # 計算機ツールのテスト
            print("🧮 計算機ツールをテスト...")
            calc_tests = [
                {"operation": "add", "a": 15, "b": 7},
                {"operation": "subtract", "a": 20, "b": 8},
                {"operation": "multiply", "a": 6, "b": 7},
                {"operation": "divide", "a": 100, "b": 4},
            ]

            for test in calc_tests:
                result = await client.call_tool("calculator", test)
                print(f"  {test['a']} {test['operation']} {test['b']} =")
                for content in result.content:
                    if hasattr(content, "text"):
                        data = json.loads(content.text)
                        print(f"    結果: {data['result']}")
            print()

            # ストレージツールのテスト
            print("💾 ストレージツールをテスト...")
            test_data = [
                {"key": "name", "value": "Bob"},
                {"key": "age", "value": "25"},
                {"key": "city", "value": "Osaka"},
            ]

            for data in test_data:
                await client.call_tool("storage_set", data)
                print(f"  ✅ 保存: {data['key']} = {data['value']}")
            print()

            # データを取得
            print("📖 データを取得中...")
            for data in test_data:
                result = await client.call_tool("storage_get", {"key": data["key"]})
                for content in result.content:
                    if hasattr(content, "text"):
                        item = json.loads(content.text)
                        print(f"  {data['key']}: {item.get('value', 'N/A')}")
            print()

            # 一覧表示
            print("📃 ストレージ一覧:")
            list_result = await client.call_tool("storage_list", {})
            for content in list_result.content:
                if hasattr(content, "text"):
                    data = json.loads(content.text)
                    print(f"  合計: {data['count']}件")
                    for item in data["items"]:
                        print(f"  - {item['key']}: {item['value']}")
            print()

            # システム情報
            print("💻 システム情報を取得中...")
            sys_result = await client.call_tool("system_info", {})
            for content in sys_result.content:
                if hasattr(content, "text"):
                    info = json.loads(content.text)
                    print(f"  プラットフォーム: {info.get('platform', 'N/A')}")
                    print(f"  Python: {info.get('python_version', 'N/A')}")
            print()

            # エコーツール
            print("📢 エコーツールをテスト...")
            messages = ["Hello from Python!", "テストメッセージ"]
            for msg in messages:
                result = await client.call_tool("echo", {"message": msg})
                for content in result.content:
                    if hasattr(content, "text"):
                        echo = json.loads(content.text)
                        print(f"  {msg} => {echo['echo']}")
            print()

            # クリーンアップ
            print("🧹 クリーンアップ中...")
            for data in test_data:
                await client.call_tool("storage_delete", {"key": data["key"]})
                print(f"  🗑️  削除: {data['key']}")
            print()

            print("🎉 すべてのテストが完了しました！")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n👋 中断されました")
    except Exception as e:
        print(f"\n❌ エラー: {e}")
        if "401" in str(e):
            print("💡 ヒント: API_KEYを確認してください")

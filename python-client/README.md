# MCPクライアント - Python版

Python実装のMCPクライアントサンプルです。

## インストール

```bash
cd python-client

# 仮想環境の作成
python3 -m venv venv
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt
```

## 使用方法

### リモートサーバーへの接続

```bash
# .envファイルの作成
cp .env.example .env

# API_KEYとURLを設定
# .envファイルを編集

# クライアントを実行
python3 src/remote_client.py
```

## 実装例

### 基本的な接続

```python
from mcp.client import Client
from mcp.client.sse import sse_client

async with sse_client(url, headers=headers) as (read, write):
    async with Client(read, write) as client:
        await client.initialize()

        # ツールの一覧
        tools = await client.list_tools()

        # ツールの実行
        result = await client.call_tool("calculator", {
            "operation": "add",
            "a": 10,
            "b": 5
        })
```

## TypeScript版との比較

| 機能 | TypeScript版 | Python版 |
|------|-------------|---------|
| ローカル接続 | ✅ | ✅ |
| リモート接続 | ✅ | ✅ |
| インタラクティブCLI | ✅ | - |
| サンプル | ✅ | ✅ |

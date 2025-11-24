# リモートMCPサーバー - Python版

このディレクトリには、Python実装のリモートMCPサーバーが含まれています。

## 🐍 Python版の特徴

- **Python 3.10+** 対応
- **FastAPI** を使用したリモートサーバー
- **型安全**: Pydantic によるデータ検証
- **非同期**: asyncio を使用した高パフォーマンス
- **TypeScript版と同じツールセット**

## 📋 前提条件

- Python 3.10以上
- pip または poetry

## 🚀 インストール

```bash
cd python

# 仮想環境の作成（推奨）
python3 -m venv venv
source venv/bin/activate  # Linux/macOS
# または
venv\Scripts\activate  # Windows

# 依存関係のインストール
pip install -r requirements.txt

# または開発用依存関係も含める
pip install -e ".[dev]"
```

## 使用方法

### 1. ローカルMCPサーバー（stdio版）

```bash
# 直接実行
python3 src/local/server.py

# または実行権限を付与して
chmod +x src/local/server.py
./src/local/server.py
```

**Claude Desktop設定** (`config/claude_desktop_local.json`):

```json
{
  "mcpServers": {
    "local-mcp-python": {
      "command": "python3",
      "args": [
        "/absolute/path/to/python/src/local/server.py"
      ],
      "env": {
        "PYTHONPATH": "/absolute/path/to/python"
      }
    }
  }
}
```

### 2. リモートMCPサーバー（FastAPI版）

```bash
# .envファイルの作成
cp .env.example .env

# .envファイルを編集してAPI_KEYを設定
# API_KEY=your-secret-key-here

# サーバーの起動
cd src/remote/fastapi
python3 server.py

# または uvicorn で直接起動
uvicorn src.remote.fastapi.server:app --host 0.0.0.0 --port 8000
```

**Claude Desktop設定** (`config/claude_desktop_remote.json`):

```json
{
  "mcpServers": {
    "remote-mcp-python": {
      "url": "http://localhost:8000/sse",
      "headers": {
        "Authorization": "Bearer your-secret-key-here"
      },
      "transport": "sse"
    }
  }
}
```

## 🛠️ 提供ツール

TypeScript版と同じツールセット：

1. **calculator** - 四則演算
2. **storage_set/get/delete/list** - 簡易KVストレージ
3. **system_info** - システム情報取得（Python版はpsutilを使用）
4. **echo** - デバッグ用エコー

## 📦 プロジェクト構造

```
python/
├── src/
│   ├── shared/
│   │   └── tools/          # 共通ツール（TypeScript版と同等）
│   ├── local/
│   │   └── server.py       # ローカルMCPサーバー
│   └── remote/
│       └── fastapi/
│           └── server.py   # FastAPI版リモートサーバー
├── config/                 # Claude Desktop設定例
├── requirements.txt        # 依存関係
├── pyproject.toml         # プロジェクト設定
├── .env.example           # 環境変数テンプレート
└── README.md
```

## 🔑 TypeScript版との違い

| 項目 | TypeScript版 | Python版 |
|------|-------------|---------|
| ランタイム | Node.js | Python 3.10+ |
| Webフレームワーク | Express | FastAPI |
| 型システム | TypeScript | Pydantic |
| 非同期 | Promise/async-await | asyncio |
| パッケージマネージャ | npm | pip/poetry |
| デフォルトポート | 3000 | 8000 |

## 🧪 開発

### コードフォーマット

```bash
# Black でフォーマット
black src/

# Ruff で lint
ruff check src/
```

### 型チェック

```bash
mypy src/
```

### テスト

```bash
pytest
```

## 📝 環境変数

`.env`ファイルで以下の環境変数を設定：

```env
PORT=8000
API_KEY=your-secret-key-here
ALLOWED_ORIGINS=*
LOG_LEVEL=INFO
WORKERS=1
RELOAD=true
```

## 🚢 デプロイ

### Railway / Render

TypeScript版と同様の手順でデプロイできます。`requirements.txt` が自動検出されます。

起動コマンド:
```bash
python3 src/remote/fastapi/server.py
```

または:
```bash
uvicorn src.remote.fastapi.server:app --host 0.0.0.0 --port $PORT
```

### Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
ENV PYTHONPATH=/app

CMD ["python3", "src/remote/fastapi/server.py"]
```

## 🔒 セキュリティ

Python版もTypeScript版と同じセキュリティ機能を実装：

- APIキー認証（Bearer token）
- CORS設定
- 環境変数による設定管理

## トラブルシューティング

### ModuleNotFoundError

```bash
# PYTHONPATHを設定
export PYTHONPATH=/path/to/python:$PYTHONPATH

# または絶対パスで実行
python3 /absolute/path/to/python/src/local/server.py
```

### psutil インストールエラー

```bash
# Ubuntu/Debian
sudo apt-get install python3-dev

# macOS
xcode-select --install

# その後
pip install psutil
```

## 📚 参考リンク

- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [FastAPI ドキュメント](https://fastapi.tiangolo.com)
- [Pydantic ドキュメント](https://docs.pydantic.dev)

## TypeScript版との併用

TypeScript版とPython版は独立して動作するため、両方を同時に使用できます：

```json
{
  "mcpServers": {
    "local-mcp-ts": {
      "command": "node",
      "args": ["../dist/local/server.js"]
    },
    "local-mcp-python": {
      "command": "python3",
      "args": ["/path/to/python/src/local/server.py"]
    },
    "remote-mcp-ts": {
      "url": "http://localhost:3000/sse",
      "headers": { "Authorization": "Bearer key1" }
    },
    "remote-mcp-python": {
      "url": "http://localhost:8000/sse",
      "headers": { "Authorization": "Bearer key2" }
    }
  }
}
```

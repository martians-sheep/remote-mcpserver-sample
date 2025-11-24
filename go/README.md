# Go MCP Server Implementation

Go言語によるMCP (Model Context Protocol) サーバーの実装サンプルです。

## 🎯 特徴

- 📡 **Local Server (stdio)** - 標準入出力による通信
- 🌐 **Remote Server (HTTP/SSE)** - Server-Sent Eventsによるリモート通信
- 🔧 **共通ツール実装** - TypeScript/Python版と同じツールセット
- 🚀 **高性能** - Goの並行処理とパフォーマンス
- 🔒 **セキュリティ** - APIキー認証、CORS、レート制限

## 📦 提供ツール

1. **calculator** - 四則演算
2. **storage_set** - データ保存
3. **storage_get** - データ取得
4. **storage_delete** - データ削除
5. **storage_list** - データ一覧
6. **system_info** - システム情報
7. **echo** - エコー

## 🚀 セットアップ

### 前提条件

- Go 1.21以上

### インストール

```bash
cd go

# 依存関係のインストール
go mod download

# .envファイルの作成
cp .env.example .env
```

## 🔧 使い方

### 1. Local Server (stdio)

```bash
# ビルド
go build -o bin/local-server ./cmd/local

# 実行
./bin/local-server
```

Claude Desktopの設定:
```json
{
  "mcpServers": {
    "go-mcp-local": {
      "command": "/absolute/path/to/go/bin/local-server"
    }
  }
}
```

### 2. Remote Server (HTTP/SSE)

```bash
# .envファイルを編集してAPIキーを設定
echo "MCP_API_KEY=your-secret-key" > .env

# ビルド
go build -o bin/remote-server ./cmd/remote

# 実行
./bin/remote-server
```

Claude Desktopの設定:
```json
{
  "mcpServers": {
    "go-mcp-remote": {
      "url": "http://localhost:8080/sse",
      "headers": {
        "Authorization": "Bearer your-secret-key"
      },
      "transport": "sse"
    }
  }
}
```

## 📝 環境変数

`.env`ファイルで以下の設定ができます:

```env
# サーバーポート (デフォルト: 8080)
PORT=8080

# APIキー (必須)
MCP_API_KEY=your-secret-key

# CORS設定 (デフォルト: *)
CORS_ORIGIN=*

# レート制限 (デフォルト: 100)
RATE_LIMIT=100
```

## 🏗️ プロジェクト構造

```
go/
├── cmd/
│   ├── local/          # Localサーバー (stdio)
│   │   └── main.go
│   └── remote/         # Remoteサーバー (HTTP/SSE)
│       └── main.go
├── internal/
│   ├── mcp/           # MCPプロトコル実装
│   │   ├── server.go
│   │   ├── transport_stdio.go
│   │   └── transport_sse.go
│   └── tools/         # ツール実装
│       ├── calculator.go
│       ├── storage.go
│       ├── system.go
│       └── echo.go
├── go.mod
├── go.sum
└── README.md
```

## 🔍 TypeScript/Python版との違い

### メリット
- ✅ **高性能**: コンパイル言語による高速実行
- ✅ **シンプルなデプロイ**: 単一バイナリで配布可能
- ✅ **並行処理**: Goルーチンによる効率的な並行処理
- ✅ **型安全**: 強力な静的型システム
- ✅ **メモリ効率**: 低メモリフットプリント

### 注意点
- ⚠️ **公式SDKなし**: MCP公式Go SDKは未提供のため独自実装
- ⚠️ **メンテナンス**: プロトコル変更時の独自対応が必要

## 🧪 テスト

```bash
# ユニットテスト
go test ./...

# カバレッジ
go test -cover ./...

# ベンチマーク
go test -bench=. ./...
```

## 📦 ビルド

```bash
# すべてのプラットフォーム向けビルド
./build.sh

# 特定プラットフォーム
GOOS=linux GOARCH=amd64 go build -o bin/local-server-linux-amd64 ./cmd/local
GOOS=darwin GOARCH=arm64 go build -o bin/local-server-darwin-arm64 ./cmd/local
```

## 🚀 デプロイ

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o /bin/remote-server ./cmd/remote

FROM alpine:latest
COPY --from=builder /bin/remote-server /bin/remote-server
EXPOSE 8080
CMD ["/bin/remote-server"]
```

### Railway / Render

`Procfile`:
```
web: ./bin/remote-server
```

ビルドコマンド:
```bash
go build -o bin/remote-server ./cmd/remote
```

## 🔗 関連リンク

- TypeScript版: `../src/`
- Python版: `../python/`
- クライアント: `../client/`
- Chat UI: `../chat-ui/`

## ライセンス

MIT

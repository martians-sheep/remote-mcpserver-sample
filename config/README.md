# Claude Desktop設定ファイル

このディレクトリには、Claude Desktopで各MCPサーバーに接続するための設定ファイルが含まれています。

## 設定ファイルの場所

Claude Desktopの設定ファイルは以下の場所にあります：

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

## ローカルMCPサーバー設定

### 本番ビルド版 (`claude_desktop_local.json`)

```json
{
  "mcpServers": {
    "local-mcp-sample": {
      "command": "node",
      "args": [
        "/absolute/path/to/remote-mcpserver-sample/dist/local/server.js"
      ]
    }
  }
}
```

**使用前の設定:**
1. プロジェクトをビルド: `npm run build`
2. パスを実際のプロジェクトのパスに変更

### 開発版 (`claude_desktop_local_dev.json`)

```json
{
  "mcpServers": {
    "local-mcp-sample-dev": {
      "command": "npx",
      "args": [
        "tsx",
        "/absolute/path/to/remote-mcpserver-sample/src/local/server.ts"
      ]
    }
  }
}
```

**特徴:**
- TypeScriptを直接実行（ビルド不要）
- 開発時に便利

## リモートMCPサーバー設定

### ローカル開発版 (`claude_desktop_remote.json`)

```json
{
  "mcpServers": {
    "remote-mcp-sample": {
      "url": "http://localhost:3000/sse",
      "headers": {
        "Authorization": "Bearer your-api-key-here"
      },
      "transport": "sse"
    }
  }
}
```

**使用前の設定:**
1. `.env`ファイルを作成してAPIキーを設定
2. サーバーを起動: `npm run dev:remote`
3. `your-api-key-here`を実際のAPIキーに変更

### 本番環境版 (`claude_desktop_remote_production.json`)

```json
{
  "mcpServers": {
    "remote-mcp-sample-production": {
      "url": "https://your-server.railway.app/sse",
      "headers": {
        "Authorization": "Bearer your-production-api-key-here"
      },
      "transport": "sse"
    }
  }
}
```

**使用前の設定:**
1. サーバーをデプロイ（Railway、Renderなど）
2. URLをデプロイ先のURLに変更
3. APIキーを本番環境のAPIキーに変更

### Cloudflare Workers版 (`claude_desktop_cloudflare.json`)

```json
{
  "mcpServers": {
    "remote-mcp-cloudflare": {
      "url": "https://remote-mcp-server.your-subdomain.workers.dev/sse",
      "headers": {
        "Authorization": "Bearer your-cloudflare-api-key-here"
      },
      "transport": "sse"
    }
  }
}
```

**使用前の設定:**
1. Cloudflare Workersにデプロイ: `npm run deploy:cf`
2. URLをWorkers URLに変更
3. APIキーを設定: `wrangler secret put API_KEY`

## ローカルとリモートの主な違い

| 項目 | ローカル設定 | リモート設定 |
|------|------------|------------|
| 通信方式 | `command` + `args` (stdio) | `url` + `transport` (HTTP/SSE) |
| 認証 | 不要 | `Authorization` ヘッダー必須 |
| サーバー起動 | Claude Desktopが自動起動 | 事前に起動が必要 |
| 設定の複雑さ | シンプル | 認証・URL設定が必要 |
| ネットワーク | 不要 | インターネット接続が必要 |
| スケーリング | 単一プロセス | 複数クライアントで共有可能 |

## トラブルシューティング

### ローカル接続の問題

**症状**: サーバーが起動しない

**確認事項**:
- パスが絶対パスで正しいか
- Node.jsがインストールされているか
- ビルドが完了しているか（本番ビルド版の場合）

### リモート接続の問題

**症状**: 認証エラー

**確認事項**:
- APIキーが正しいか
- `Bearer `プレフィックスが付いているか
- サーバー側の`.env`ファイルにAPIキーが設定されているか

**症状**: 接続できない

**確認事項**:
- サーバーが起動しているか
- URLが正しいか（HTTPSかHTTPか）
- ファイアウォールやネットワーク設定

## 設定の適用方法

1. 使用したい設定ファイルの内容をコピー
2. Claude Desktopの設定ファイルに追記または上書き
3. Claude Desktopを再起動
4. 設定が反映されていることを確認

# リモートMCPサーバー サンプル実装

このプロジェクトは、**ローカルMCPサーバー**と**リモートMCPサーバー**の違いを明確に示すサンプル実装です。Model Context Protocol (MCP)の複数の実装パターンを**TypeScript版、Python版、Go版、Rust版**で提供します。

## 🎯 プロジェクトの目的

- ローカルMCP（stdio版）とリモートMCP（HTTP/SSE版）の実装の違いを理解する
- 本格的なデプロイに向けた実装例を提供する
- Cloudflare Workersでのエッジデプロイの実装例を示す
- **TypeScript版、Python版、Go版、Rust版の4言語で提供**し、言語の選択肢を広げる

## 📁 プロジェクト構成

```
remote-mcpserver-sample/
├── src/                    # TypeScript版
│   ├── shared/
│   │   ├── tools/          # 共通ツール実装
│   │   └── types/          # 型定義
│   ├── local/
│   │   └── server.ts       # ローカルMCPサーバー（stdio版）
│   ├── remote/
│   │   ├── express/
│   │   │   └── server.ts   # リモートMCPサーバー（Express版）
│   │   └── cloudflare/
│   │       └── worker.ts   # リモートMCPサーバー（Cloudflare Workers版）
│   └── utils/
│       ├── auth.ts         # 認証ユーティリティ
│       └── logger.ts       # ログ
├── python/                 # Python版 🐍
│   ├── src/
│   │   ├── shared/
│   │   │   └── tools/      # 共通ツール実装
│   │   ├── local/
│   │   │   └── server.py   # ローカルMCPサーバー（stdio版）
│   │   └── remote/
│   │       └── fastapi/
│   │           └── server.py  # リモートMCPサーバー（FastAPI版）
│   ├── requirements.txt
│   └── README.md
├── go/                     # Go版 🚀
│   ├── cmd/
│   │   ├── local/
│   │   │   └── main.go     # ローカルMCPサーバー（stdio版）
│   │   └── remote/
│   │       └── main.go     # リモートMCPサーバー（Gin版）
│   ├── internal/
│   │   ├── mcp/            # MCPプロトコル実装
│   │   └── tools/          # 共通ツール実装
│   ├── go.mod
│   └── README.md
├── rust/                   # Rust版 🦀
│   ├── mcp-core/           # コアライブラリ
│   │   └── src/
│   │       ├── types.rs    # MCP型定義
│   │       ├── server.rs   # サーバーロジック
│   │       └── tools/      # ツール実装
│   ├── mcp-local/          # ローカルMCPサーバー（stdio版）
│   ├── mcp-remote/         # リモートMCPサーバー（Axum版）
│   ├── Cargo.toml
│   └── README.md
├── client/                 # MCPクライアント実装
├── chat-ui/               # Web UI (Next.js)
├── config/                 # Claude Desktop設定ファイル
├── deploy/                 # デプロイ設定
├── docs/                   # ドキュメント
└── README.md
```

## 🔑 ローカルとリモートの主な違い

| 項目 | ローカルMCP | リモートMCP (Express) | リモートMCP (Cloudflare) |
|------|-----------|---------------------|------------------------|
| **通信方式** | stdio | HTTP/SSE | HTTP/SSE (Edge) |
| **認証** | 不要 | APIキー必須 | APIキー必須 |
| **起動方法** | Claude Desktopが自動起動 | 手動起動が必要 | デプロイ後自動実行 |
| **設定の複雑さ** | シンプル | 中程度 | 高度 |
| **ネットワーク** | 不要 | 必要 | 必要 |
| **スケーリング** | 単一プロセス | 垂直スケール | 自動グローバルスケール |
| **セキュリティ** | ローカルのみ | HTTPS、CORS、レート制限 | HTTPS、CORS、DDoS保護 |
| **ステート管理** | メモリ | メモリ/Redis | Durable Objects |
| **デプロイ** | 不要 | VPS、Railway、Render | Cloudflare Workers |
| **コスト** | 無料 | 有料（ホスティング費用） | 無料枠あり |

## 🚀 クイックスタート

### 前提条件

**TypeScript版:**
- Node.js 18以上
- npm または yarn

**Python版:**
- Python 3.10以上
- pip

### インストール

#### TypeScript版

```bash
# リポジトリのクローン
git clone https://github.com/your-username/remote-mcpserver-sample.git
cd remote-mcpserver-sample

# 依存関係のインストール
npm install

# ビルド
npm run build
```

#### Python版

```bash
cd python

# 仮想環境の作成（推奨）
python3 -m venv venv
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt
```

#### Go版

```bash
cd go

# 依存関係のインストール
go mod download

# ビルド
make build
```

#### Rust版

```bash
cd rust

# ビルド（依存関係のダウンロードも自動）
cargo build
```

### 1. ローカルMCPサーバー（stdio版）

**特徴**: 最もシンプルな実装。Claude Desktopから直接起動される。

```bash
# 開発モード
npm run dev:local

# または本番ビルド版
npm run start:local
```

**Claude Desktop設定** (`config/claude_desktop_local.json`):

```json
{
  "mcpServers": {
    "local-mcp-sample": {
      "command": "node",
      "args": ["/absolute/path/to/dist/local/server.js"]
    }
  }
}
```

### 2. リモートMCPサーバー（Express版）

**特徴**: HTTP/SSE通信、APIキー認証、CORS対応。開発・テストに最適。

```bash
# .envファイルの作成
cp .env.example .env

# API_KEYを設定
# .envファイルを編集して API_KEY=your-secret-key を設定

# サーバーの起動
npm run dev:remote
```

サーバーは `http://localhost:3000` で起動します。

**Claude Desktop設定** (`config/claude_desktop_remote.json`):

```json
{
  "mcpServers": {
    "remote-mcp-sample": {
      "url": "http://localhost:3000/sse",
      "headers": {
        "Authorization": "Bearer your-secret-key"
      },
      "transport": "sse"
    }
  }
}
```

### 3. リモートMCPサーバー（Cloudflare Workers版）

**特徴**: エッジネットワークで実行、グローバル展開、自動スケール。本番環境向け。

```bash
# Cloudflare アカウントでログイン
npx wrangler login

# API_KEYの設定
npx wrangler secret put API_KEY

# デプロイ
npm run deploy:cf
```

**Claude Desktop設定** (`config/claude_desktop_cloudflare.json`):

```json
{
  "mcpServers": {
    "remote-mcp-cloudflare": {
      "url": "https://remote-mcp-server.your-subdomain.workers.dev/sse",
      "headers": {
        "Authorization": "Bearer your-api-key"
      },
      "transport": "sse"
    }
  }
}
```

## 🛠️ 提供ツール

すべての実装で以下のツールが使用可能です：

### 1. Calculator (計算機)

```typescript
// 使用例
{
  "operation": "add",
  "a": 10,
  "b": 5
}
// 結果: { "result": 15, "operation": "10 add 5 = 15" }
```

### 2. Storage (簡易KVストレージ)

```typescript
// 保存
storage_set({ "key": "name", "value": "Alice" })

// 取得
storage_get({ "key": "name" })

// 削除
storage_delete({ "key": "name" })

// 一覧
storage_list()
```

### 3. System Info (システム情報)

```typescript
// プラットフォーム、アーキテクチャ、メモリ使用量などを取得
system_info()
```

### 4. Echo (デバッグ用)

```typescript
// メッセージをエコーバック
echo({ "message": "Hello, MCP!" })
```

## 📦 デプロイ方法

### Railway へのデプロイ

1. [Railway](https://railway.app) でアカウント作成
2. GitHubリポジトリを接続
3. 環境変数を設定:
   - `API_KEY`: 任意の強力なパスワード
   - `PORT`: 3000
4. デプロイを実行

詳細: [docs/DEPLOY.md](docs/DEPLOY.md)

### Render へのデプロイ

1. `deploy/render.yaml` を使用
2. [Render](https://render.com) でリポジトリを接続
3. 環境変数 `API_KEY` を設定
4. 自動デプロイ

### Cloudflare Workers へのデプロイ

```bash
# ログイン
npx wrangler login

# デプロイ
npm run deploy:cf

# APIキーの設定
npx wrangler secret put API_KEY
```

## 🔒 セキュリティ

### ローカルMCPサーバー

- ローカル実行のため認証不要
- システムのセキュリティに依存

### リモートMCPサーバー

- **必須**: APIキー認証
- CORS設定
- レート制限（DoS対策）
- HTTPS推奨（本番環境）
- 環境変数でAPIキー管理

**重要**: `.env` ファイルはGitにコミットしないでください！

## 📖 ドキュメント

- [DIFFERENCES.md](docs/DIFFERENCES.md) - ローカルとリモートの詳細な違い
- [DEPLOY.md](docs/DEPLOY.md) - デプロイガイド
- [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) - トラブルシューティング
- [config/README.md](config/README.md) - Claude Desktop設定ガイド

## 🧪 開発

### ビルド

```bash
npm run build
```

### 開発モード（ホットリロード）

```bash
# ローカル版
npm run dev:local

# リモート版
npm run dev:remote
```

### Cloudflare Workers ローカル開発

```bash
npm run cf:dev
```

## 🎓 学習リソース

- [Model Context Protocol 公式ドキュメント](https://modelcontextprotocol.io)
- [MCP SDK](https://github.com/modelcontextprotocol/sdk)
- [Claude Desktop](https://claude.ai/download)

## 📝 ライセンス

MIT

## 🤝 コントリビューション

プルリクエストを歓迎します！

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. コミット (`git commit -m 'Add amazing feature'`)
4. プッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 💡 ユースケース

### ローカルMCPサーバーが適している場合

- 個人利用
- 機密データの処理
- ネットワーク接続が不要な場合
- シンプルなツールセット

### リモートMCPサーバーが適している場合

- チームでの共有利用
- 複数デバイスからのアクセス
- 高度な認証・認可が必要
- スケーラビリティが必要
- リモートリソースへのアクセス

### Cloudflare Workers版が適している場合

- グローバル展開が必要
- 高可用性が必要
- 自動スケーリングが必要
- エッジコンピューティングの活用
- エンタープライズグレードのインフラ

## 🔧 トラブルシューティング

問題が発生した場合は [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) を参照してください。

## 📞 サポート

- Issue: [GitHub Issues](https://github.com/your-username/remote-mcpserver-sample/issues)
- MCP公式Discord: [参加リンク](https://discord.gg/modelcontextprotocol)
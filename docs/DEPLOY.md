# デプロイガイド

このガイドでは、リモートMCPサーバーを各種プラットフォームにデプロイする方法を説明します。

## 前提条件

- Node.js 18以上
- Git
- プロジェクトのビルド完了 (`npm run build`)

## 1. Railway へのデプロイ

[Railway](https://railway.app) は、GitHubリポジトリから簡単にデプロイできるPaaSです。

### ステップ1: Railwayアカウント作成

1. [Railway](https://railway.app) にアクセス
2. GitHubアカウントでサインアップ

### ステップ2: プロジェクト作成

```bash
# Railway CLIのインストール（オプション）
npm install -g @railway/cli

# ログイン
railway login

# プロジェクト作成
railway init
```

### ステップ3: 環境変数の設定

Railwayダッシュボードで以下の環境変数を設定：

```
API_KEY=your-strong-secret-key-here
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=*
LOG_LEVEL=info
```

### ステップ4: デプロイ

```bash
# GitHubにプッシュ
git push origin main

# または Railway CLIでデプロイ
railway up
```

### ステップ5: URLの確認

```bash
railway open
```

生成されたURL（例: `https://your-app.railway.app`）をメモします。

### ステップ6: Claude Desktop設定

```json
{
  "mcpServers": {
    "remote-mcp-railway": {
      "url": "https://your-app.railway.app/sse",
      "headers": {
        "Authorization": "Bearer your-strong-secret-key-here"
      },
      "transport": "sse"
    }
  }
}
```

## 2. Render へのデプロイ

[Render](https://render.com) は、YAML設定ファイルで簡単にデプロイできるPaaSです。

### ステップ1: Renderアカウント作成

1. [Render](https://render.com) にアクセス
2. GitHubアカウントでサインアップ

### ステップ2: リポジトリ接続

1. 「New +」→「Blueprint」を選択
2. GitHubリポジトリを接続
3. `deploy/render.yaml` が自動検出される

### ステップ3: 環境変数の設定

Renderダッシュボードで `API_KEY` を設定：

```
API_KEY=your-strong-secret-key-here
```

他の環境変数は `render.yaml` で定義済み。

### ステップ4: デプロイ

「Apply」ボタンをクリックすると自動デプロイが開始されます。

### ステップ5: URLの確認

デプロイ完了後、URLが表示されます（例: `https://remote-mcp-server.onrender.com`）。

### ステップ6: Claude Desktop設定

```json
{
  "mcpServers": {
    "remote-mcp-render": {
      "url": "https://remote-mcp-server.onrender.com/sse",
      "headers": {
        "Authorization": "Bearer your-strong-secret-key-here"
      },
      "transport": "sse"
    }
  }
}
```

## 3. Cloudflare Workers へのデプロイ

[Cloudflare Workers](https://workers.cloudflare.com) は、エッジネットワークで実行されるサーバーレスプラットフォームです。

### ステップ1: Cloudflareアカウント作成

1. [Cloudflare](https://www.cloudflare.com) にアクセス
2. アカウント作成

### ステップ2: Wrangler CLIセットアップ

```bash
# ログイン
npx wrangler login

# アカウントIDの確認
npx wrangler whoami
```

### ステップ3: wrangler.toml の設定

`deploy/wrangler.toml` を編集：

```toml
name = "remote-mcp-server"
account_id = "your-account-id-here"  # ← ここを更新
main = "src/remote/cloudflare/worker.ts"
compatibility_date = "2024-11-01"

[[durable_objects.bindings]]
name = "MCP_STORAGE"
class_name = "MCPStorage"
script_name = "remote-mcp-server"

[[migrations]]
tag = "v1"
new_classes = ["MCPStorage"]
```

### ステップ4: API_KEYの設定

```bash
# シークレットの設定
npx wrangler secret put API_KEY

# プロンプトが表示されたら、APIキーを入力
```

### ステップ5: デプロイ

```bash
# デプロイ
npm run deploy:cf

# または
npx wrangler deploy deploy/wrangler.toml
```

### ステップ6: URLの確認

デプロイが成功すると、URLが表示されます：

```
https://remote-mcp-server.your-subdomain.workers.dev
```

### ステップ7: Claude Desktop設定

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

## 4. Docker でのデプロイ

汎用的なDockerデプロイです。

### ステップ1: Dockerイメージのビルド

```bash
# Dockerfileの場所に移動
cd deploy

# イメージのビルド
docker build -t remote-mcp-server ..

# または、プロジェクトルートから
docker build -f deploy/Dockerfile -t remote-mcp-server .
```

### ステップ2: コンテナの実行

```bash
docker run -d \
  -p 3000:3000 \
  -e API_KEY=your-secret-key \
  -e PORT=3000 \
  -e NODE_ENV=production \
  --name remote-mcp-server \
  remote-mcp-server
```

### ステップ3: ヘルスチェック

```bash
curl http://localhost:3000/health
```

### ステップ4: DigitalOcean、AWS、GCP等へのデプロイ

```bash
# Docker Hubにプッシュ
docker tag remote-mcp-server your-username/remote-mcp-server
docker push your-username/remote-mcp-server

# VPSで実行
ssh user@your-server
docker pull your-username/remote-mcp-server
docker run -d -p 3000:3000 -e API_KEY=... your-username/remote-mcp-server
```

## 5. VPS（Ubuntu）への直接デプロイ

### ステップ1: VPSの準備

```bash
# Node.jsのインストール
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Nginxのインストール（オプション）
sudo apt-get install -y nginx

# PM2のインストール（プロセス管理）
sudo npm install -g pm2
```

### ステップ2: プロジェクトのクローン

```bash
cd /opt
sudo git clone https://github.com/your-username/remote-mcpserver-sample.git
cd remote-mcpserver-sample
sudo npm install
sudo npm run build
```

### ステップ3: 環境変数の設定

```bash
sudo nano .env
```

```env
API_KEY=your-strong-secret-key
PORT=3000
NODE_ENV=production
ALLOWED_ORIGINS=*
LOG_LEVEL=info
```

### ステップ4: PM2で起動

```bash
sudo pm2 start dist/remote/express/server.js --name remote-mcp-server
sudo pm2 save
sudo pm2 startup
```

### ステップ5: Nginxリバースプロキシ設定（オプション）

```bash
sudo nano /etc/nginx/sites-available/remote-mcp-server
```

`deploy/nginx.conf` の内容を参考に設定。

```bash
sudo ln -s /etc/nginx/sites-available/remote-mcp-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### ステップ6: SSL証明書（Let's Encrypt）

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 6. デプロイ後の確認

### ヘルスチェック

```bash
curl https://your-server.com/health
```

期待される応答：

```json
{
  "status": "healthy",
  "timestamp": "2024-11-24T...",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

### APIキーのテスト

```bash
curl -H "Authorization: Bearer your-api-key" \
     https://your-server.com/sse
```

### Claude Desktopでのテスト

1. Claude Desktop設定ファイルを更新
2. Claude Desktopを再起動
3. チャットで「使用可能なツールは？」と質問

## 7. モニタリングとログ

### Railway

```bash
railway logs
```

### Render

Renderダッシュボードの「Logs」タブ

### Cloudflare Workers

```bash
npx wrangler tail
```

### Docker

```bash
docker logs remote-mcp-server -f
```

### PM2

```bash
pm2 logs remote-mcp-server
pm2 monit
```

## トラブルシューティング

### 接続できない

1. サーバーが起動しているか確認
2. ファイアウォール設定を確認
3. URLが正しいか確認
4. APIキーが正しいか確認

### 認証エラー

1. `Authorization` ヘッダーが正しいか確認
2. `Bearer `プレフィックスが付いているか確認
3. サーバー側の `API_KEY` 環境変数を確認

### SSEが動作しない

1. CORSヘッダーが正しく設定されているか確認
2. リバースプロキシの設定を確認（Nginxの場合）
3. タイムアウト設定を確認

詳細は [TROUBLESHOOTING.md](TROUBLESHOOTING.md) を参照してください。

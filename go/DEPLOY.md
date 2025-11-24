# Go MCP Server デプロイガイド

## 📦 ビルド

### ローカルビルド

```bash
# Makefileを使用
make build

# または手動ビルド
go build -o bin/local-server ./cmd/local
go build -o bin/remote-server ./cmd/remote

# またはbuild.shを使用
./build.sh
```

### クロスプラットフォームビルド

```bash
# すべてのプラットフォーム向けビルド
make build-all

# 特定プラットフォーム
GOOS=linux GOARCH=amd64 go build -o bin/remote-server-linux ./cmd/remote
GOOS=darwin GOARCH=arm64 go build -o bin/remote-server-mac ./cmd/remote
GOOS=windows GOARCH=amd64 go build -o bin/remote-server.exe ./cmd/remote
```

## 🐳 Docker

### イメージのビルド

```bash
docker build -t go-mcp-server .
```

### コンテナの実行

```bash
docker run -d \
  -p 8080:8080 \
  -e MCP_API_KEY=your-secret-key \
  -e PORT=8080 \
  --name go-mcp-server \
  go-mcp-server
```

### docker-compose

```yaml
version: '3.8'
services:
  mcp-server:
    build: .
    ports:
      - "8080:8080"
    environment:
      - MCP_API_KEY=your-secret-key
      - PORT=8080
      - CORS_ORIGIN=*
    restart: unless-stopped
```

## ☁️ クラウドデプロイ

### Railway

1. Railwayプロジェクトを作成
2. GitHubリポジトリを接続
3. 環境変数を設定:
   ```
   MCP_API_KEY=your-secret-key
   PORT=8080
   ```
4. ビルドコマンド:
   ```bash
   cd go && go build -o bin/remote-server ./cmd/remote
   ```
5. スタートコマンド:
   ```bash
   ./go/bin/remote-server
   ```

### Render

1. `render.yaml`を作成:

```yaml
services:
  - type: web
    name: go-mcp-server
    env: docker
    dockerfilePath: ./go/Dockerfile
    dockerContext: ./go
    envVars:
      - key: MCP_API_KEY
        sync: false
      - key: PORT
        value: 8080
```

2. Renderダッシュボードでデプロイ

### Google Cloud Run

```bash
# プロジェクトIDを設定
PROJECT_ID=your-project-id

# イメージをビルド
gcloud builds submit --tag gcr.io/$PROJECT_ID/go-mcp-server

# デプロイ
gcloud run deploy go-mcp-server \
  --image gcr.io/$PROJECT_ID/go-mcp-server \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars MCP_API_KEY=your-secret-key
```

### AWS ECS (Fargate)

1. ECRリポジトリを作成
2. イメージをプッシュ:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
docker tag go-mcp-server:latest $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/go-mcp-server:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/go-mcp-server:latest
```
3. ECS/Fargateでタスク定義を作成
4. サービスをデプロイ

### Azure Container Instances

```bash
# リソースグループを作成
az group create --name mcp-server-rg --location eastus

# コンテナをデプロイ
az container create \
  --resource-group mcp-server-rg \
  --name go-mcp-server \
  --image your-registry/go-mcp-server \
  --dns-name-label go-mcp-unique \
  --ports 8080 \
  --environment-variables MCP_API_KEY=your-secret-key
```

## 🖥️ VPS / 専用サーバー

### systemdサービス

1. バイナリをデプロイ:
```bash
scp bin/remote-server user@server:/opt/mcp-server/
```

2. systemdサービスを作成 (`/etc/systemd/system/mcp-server.service`):
```ini
[Unit]
Description=Go MCP Server
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/mcp-server
ExecStart=/opt/mcp-server/remote-server
Environment="MCP_API_KEY=your-secret-key"
Environment="PORT=8080"
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. サービスを有効化:
```bash
sudo systemctl daemon-reload
sudo systemctl enable mcp-server
sudo systemctl start mcp-server
```

### Nginx リバースプロキシ

```nginx
server {
    listen 80;
    server_name mcp.example.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # SSE support
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header X-Accel-Buffering no;
    }
}
```

## 🔒 セキュリティ

### API キー管理

本番環境では:
- 環境変数でAPIキーを管理
- シークレット管理サービスを使用 (AWS Secrets Manager, GCP Secret Manager, etc.)
- 定期的にキーをローテーション

### HTTPS

本番環境では必ずHTTPSを使用:
- Let's Encryptで無料SSL証明書を取得
- クラウドプロバイダーのロードバランサー/CDNを使用

### ファイアウォール

必要なポートのみを開放:
```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 📊 モニタリング

### ヘルスチェック

```bash
curl http://localhost:8080/health
```

### ログ

```bash
# systemd
sudo journalctl -u mcp-server -f

# Docker
docker logs -f go-mcp-server
```

## 🔄 アップデート

### ローカルバイナリ

```bash
# 新しいバイナリをビルド
go build -o bin/remote-server ./cmd/remote

# サーバーに転送
scp bin/remote-server user@server:/opt/mcp-server/

# サービスを再起動
ssh user@server 'sudo systemctl restart mcp-server'
```

### Docker

```bash
# 新しいイメージをビルド
docker build -t go-mcp-server:latest .

# コンテナを再起動
docker stop go-mcp-server
docker rm go-mcp-server
docker run -d -p 8080:8080 -e MCP_API_KEY=your-key --name go-mcp-server go-mcp-server:latest
```

## 🧪 デプロイ検証

```bash
# ヘルスチェック
curl http://your-server:8080/health

# SSE接続テスト
curl -H "Authorization: Bearer your-api-key" http://your-server:8080/sse
```

## 🔗 関連リンク

- メインREADME: `README.md`
- Docker Hub: https://hub.docker.com/
- Railway: https://railway.app/
- Render: https://render.com/
- Google Cloud Run: https://cloud.google.com/run

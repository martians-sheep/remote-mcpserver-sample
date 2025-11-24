# トラブルシューティング

リモートMCPサーバーの実装・運用で発生する可能性のある問題と解決方法をまとめています。

## 目次

1. [ローカルMCPサーバーの問題](#ローカルmcpサーバーの問題)
2. [リモートMCPサーバーの問題](#リモートmcpサーバーの問題)
3. [認証・認可の問題](#認証認可の問題)
4. [ネットワークの問題](#ネットワークの問題)
5. [パフォーマンスの問題](#パフォーマンスの問題)
6. [デプロイの問題](#デプロイの問題)

## ローカルMCPサーバーの問題

### サーバーが起動しない

**症状:**
```
Error: Cannot find module...
```

**原因:**
- ビルドが完了していない
- パスが間違っている
- Node.jsがインストールされていない

**解決方法:**

```bash
# 1. ビルドを実行
npm run build

# 2. パスを確認（絶対パスであること）
pwd
# 出力: /Users/yourname/projects/remote-mcpserver-sample

# 3. Claude Desktop設定で絶対パスを使用
{
  "mcpServers": {
    "local-mcp-sample": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/remote-mcpserver-sample/dist/local/server.js"
      ]
    }
  }
}
```

### TypeScriptファイルが見つからない（開発版）

**症状:**
```
Error: Cannot find module 'tsx'
```

**解決方法:**

```bash
# tsxをグローバルにインストール
npm install -g tsx

# またはローカルで実行
npx tsx src/local/server.ts
```

### サーバーが無応答

**原因:**
- ツールの実装でエラーが発生している
- 無限ループ

**解決方法:**

```bash
# ログを確認（stderrに出力される）
# Claude Desktopのログを確認

# macOS
~/Library/Logs/Claude/

# Windows
%APPDATA%\Claude\logs\

# Linux
~/.config/Claude/logs/
```

## リモートMCPサーバーの問題

### サーバーに接続できない

**症状:**
```
Connection refused
```

**確認事項:**

```bash
# 1. サーバーが起動しているか確認
curl http://localhost:3000/health

# 2. プロセスを確認
ps aux | grep node

# 3. ポートが使用されているか確認
lsof -i :3000

# 4. ファイアウォールを確認
sudo ufw status  # Ubuntu
```

**解決方法:**

```bash
# サーバーを起動
npm run dev:remote

# または本番環境
npm run start:remote

# ログを確認
npm run dev:remote 2>&1 | tee server.log
```

### Claude Desktopから接続できない

**症状:**
```
Failed to connect to server
```

**確認事項:**

1. URLが正しいか
2. サーバーが起動しているか
3. APIキーが正しいか
4. CORS設定が正しいか

**解決方法:**

```bash
# 1. ヘルスチェック
curl http://localhost:3000/health

# 2. SSEエンドポイントのテスト
curl -N -H "Authorization: Bearer your-api-key" \
     http://localhost:3000/sse

# 3. CORS設定を確認
# .env ファイル
ALLOWED_ORIGINS=*
```

### SSEが切断される

**症状:**
- 接続が頻繁に切れる
- タイムアウトエラー

**原因:**
- リバースプロキシのタイムアウト設定
- ファイアウォールのタイムアウト
- ネットワークの不安定性

**解決方法（Nginx）:**

```nginx
location /sse {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;

    # SSE用の設定
    proxy_set_header Connection '';
    proxy_set_header Cache-Control 'no-cache';
    proxy_set_header X-Accel-Buffering 'no';

    # タイムアウトを長く設定
    proxy_read_timeout 86400s;  # 24時間
    proxy_send_timeout 86400s;
}
```

## 認証・認可の問題

### 401 Unauthorized エラー

**症状:**
```json
{ "error": "Unauthorized" }
```

**確認事項:**

```bash
# 1. APIキーが設定されているか確認
echo $API_KEY

# 2. Claude Desktop設定を確認
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# 3. Bearerプレフィックスが付いているか確認
# 正しい: "Authorization": "Bearer your-api-key"
# 間違い: "Authorization": "your-api-key"
```

**解決方法:**

```bash
# .envファイルを確認
cat .env

# APIキーが設定されていない場合
echo "API_KEY=your-strong-secret-key" >> .env

# サーバーを再起動
npm run dev:remote
```

### APIキーが機能しない

**原因:**
- 環境変数が読み込まれていない
- スペルミス
- エンコーディングの問題

**デバッグ:**

```typescript
// server.ts に追加
console.log('API_KEY loaded:', !!process.env.API_KEY);
console.log('API_KEY length:', process.env.API_KEY?.length);
```

**解決方法:**

```bash
# dotenvが読み込まれているか確認
# server.ts の先頭で
import dotenv from 'dotenv';
dotenv.config();

# または起動時に指定
API_KEY=your-key npm run dev:remote
```

## ネットワークの問題

### CORSエラー

**症状:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**解決方法:**

```typescript
// server.ts
import cors from 'cors';

app.use(cors({
  origin: '*', // 開発環境
  // origin: ['https://yourdomain.com'], // 本番環境
  credentials: true,
}));
```

### ポートが既に使用されている

**症状:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**解決方法:**

```bash
# 使用中のプロセスを確認
lsof -i :3000

# プロセスを終了
kill -9 <PID>

# または別のポートを使用
PORT=3001 npm run dev:remote
```

### ファイアウォールの問題

**症状:**
- ローカルでは動作するが外部から接続できない

**解決方法（Ubuntu）:**

```bash
# ポートを開放
sudo ufw allow 3000/tcp

# ファイアウォールの状態を確認
sudo ufw status
```

**解決方法（クラウドプロバイダー）:**

- AWS: Security Groupsで3000ポートを許可
- GCP: ファイアウォールルールで3000ポートを許可
- Azure: Network Security Groupで3000ポートを許可

## パフォーマンスの問題

### レスポンスが遅い

**原因:**
- ネットワークレイテンシ
- サーバーリソース不足
- データベースクエリが遅い

**診断:**

```bash
# レイテンシを測定
time curl http://localhost:3000/health

# サーバーリソースを確認
top
htop

# メモリ使用量
free -h
```

**解決方法:**

```typescript
// キャッシュの実装
const cache = new Map<string, { value: any; expires: number }>();

function getCached(key: string): any | null {
  const item = cache.get(key);
  if (item && item.expires > Date.now()) {
    return item.value;
  }
  return null;
}

function setCache(key: string, value: any, ttl: number = 60000) {
  cache.set(key, { value, expires: Date.now() + ttl });
}
```

### メモリリーク

**症状:**
- メモリ使用量が増加し続ける
- サーバーがクラッシュする

**診断:**

```bash
# Node.jsのメモリ使用量を監視
node --inspect dist/remote/express/server.js

# Chrome DevToolsでプロファイリング
chrome://inspect
```

**解決方法:**

```typescript
// ストレージサイズを制限
class LimitedStorage {
  private maxSize = 1000;

  set(key: string, value: any) {
    if (this.store.size >= this.maxSize) {
      // 古いエントリを削除（LRU）
      const firstKey = this.store.keys().next().value;
      this.store.delete(firstKey);
    }
    this.store.set(key, value);
  }
}
```

### レート制限に引っかかる

**症状:**
```json
{ "error": "Too many requests" }
```

**解決方法:**

```typescript
// .env で調整
RATE_LIMIT_WINDOW_MS=900000  # 15分
RATE_LIMIT_MAX_REQUESTS=1000  # 1000リクエスト

// または特定のIPを除外
const limiter = rateLimit({
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === 'your-trusted-ip';
  },
});
```

## デプロイの問題

### Railway デプロイが失敗する

**症状:**
```
Build failed
```

**解決方法:**

```bash
# package.json のビルドスクリプトを確認
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/remote/express/server.js"
  }
}

# ログを確認
railway logs
```

### Cloudflare Workers デプロイが失敗する

**症状:**
```
Error: Could not resolve...
```

**解決方法:**

```bash
# wrangler.toml を確認
# account_id が設定されているか

# Durable Objects が有効か確認
npx wrangler whoami

# 再デプロイ
npx wrangler deploy --force
```

### Docker ビルドが失敗する

**症状:**
```
ERROR [builder 3/5] COPY src ./src
```

**解決方法:**

```bash
# .dockerignore を確認
cat deploy/.dockerignore

# パスを確認してビルド
docker build -f deploy/Dockerfile -t remote-mcp-server .

# ビルドログを詳細表示
docker build --no-cache --progress=plain -f deploy/Dockerfile .
```

## ログとデバッグ

### ログレベルの調整

```bash
# 開発環境: デバッグログを有効化
LOG_LEVEL=debug npm run dev:remote

# 本番環境: エラーログのみ
LOG_LEVEL=error npm run start:remote
```

### 構造化ログ

```typescript
import { logger } from './utils/logger.js';

logger.debug('Debug information', { userId: 123, action: 'login' });
logger.info('User logged in', { userId: 123 });
logger.warn('Deprecated API used', { endpoint: '/old-api' });
logger.error('Database connection failed', { error: err.message });
```

## よくある質問

### Q: ローカルとリモートを同時に使用できますか？

A: はい、Claude Desktop設定で両方を定義できます：

```json
{
  "mcpServers": {
    "local-mcp": {
      "command": "node",
      "args": ["..."]
    },
    "remote-mcp": {
      "url": "https://...",
      "headers": { "Authorization": "Bearer ..." }
    }
  }
}
```

### Q: APIキーはどのように生成すべきですか？

A: 強力なランダム文字列を使用：

```bash
# Linux/macOS
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# オンラインツール
# https://www.random.org/strings/
```

### Q: HTTPSは必須ですか？

A: 本番環境では強く推奨します。Let's Encryptで無料の証明書を取得できます。

### Q: 複数のAPIキーをサポートできますか？

A: はい、実装が必要です：

```typescript
const validKeys = new Set([
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  process.env.API_KEY_3,
]);

function validateApiKey(key: string): boolean {
  return validKeys.has(key);
}
```

## サポート

それでも解決しない場合：

1. GitHubで Issue を作成
2. MCP公式Discordで質問
3. ログファイルを添付して報告

**有用な情報:**
- OS とバージョン
- Node.js バージョン
- エラーメッセージ全文
- 関連するログ
- 再現手順

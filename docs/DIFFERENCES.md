# ローカルMCPとリモートMCPの違い

このドキュメントでは、ローカルMCPサーバーとリモートMCPサーバーの技術的な違いを詳しく説明します。

## 1. 通信方式の違い

### ローカルMCP（stdio）

```typescript
// StdioServerTransportを使用
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const transport = new StdioServerTransport();
await server.connect(transport);
```

**特徴:**
- 標準入出力（stdin/stdout）を通じた通信
- プロセス間通信（IPC）
- Claude Desktopがサーバープロセスを直接起動
- バイナリ安全な通信
- オーバーヘッドが最小限

**メリット:**
- セットアップが簡単
- 認証不要
- レイテンシが低い
- ネットワーク設定不要

**デメリット:**
- 単一クライアントのみ
- ローカルマシンに限定
- プロセスのライフサイクルがClaude Desktopに依存

### リモートMCP（HTTP/SSE）

```typescript
// SSEServerTransportを使用
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';

app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/message', res);
  await server.connect(transport);
});
```

**特徴:**
- HTTP/SSEを通じた通信
- ネットワーク経由のアクセス
- サーバーが独立して実行
- 双方向通信（SSE + POST）

**メリット:**
- 複数クライアント対応
- リモートアクセス可能
- 独立したスケーリング
- 複数デバイスから接続可能

**デメリット:**
- ネットワーク設定が必要
- 認証・セキュリティの実装が必要
- レイテンシが高い
- インフラコスト

## 2. 認証と認可

### ローカルMCP

```json
{
  "mcpServers": {
    "local-server": {
      "command": "node",
      "args": ["server.js"]
    }
  }
}
```

**認証:**
- 不要（ローカル実行のため）
- OSレベルのセキュリティに依存
- ファイルシステムのアクセス制御

### リモートMCP

```json
{
  "mcpServers": {
    "remote-server": {
      "url": "https://server.com/sse",
      "headers": {
        "Authorization": "Bearer secret-key"
      }
    }
  }
}
```

**認証:**
- APIキー必須
- Bearer トークン
- カスタムヘッダー対応

**サーバー側実装:**

```typescript
function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');
  return token === process.env.API_KEY;
}
```

**追加のセキュリティ:**
- レート制限
- IP制限
- CORS設定
- HTTPS必須（本番環境）

## 3. ステート管理

### ローカルMCP

```typescript
// メモリ内ストレージ（シンプル）
const storage = new Map<string, any>();

storage.set('key', 'value');
storage.get('key');
```

**特徴:**
- プロセスメモリに保存
- プロセス再起動でデータ消失
- シンプルで高速

### リモートMCP（Express）

```typescript
// オプション1: メモリストレージ（開発用）
const storage = new Map<string, any>();

// オプション2: Redis（本番環境）
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

await redis.set('key', 'value');
const value = await redis.get('key');
```

**特徴:**
- 永続化が可能
- 複数インスタンス間で共有
- スケーラブル

### リモートMCP（Cloudflare Workers）

```typescript
// Durable Objectsで永続化
export class MCPStorage {
  constructor(private state: DurableObjectState) {}

  async set(key: string, value: any) {
    await this.state.storage.put(key, value);
  }

  async get(key: string) {
    return await this.state.storage.get(key);
  }
}
```

**特徴:**
- グローバルに分散
- 強い一貫性保証
- 自動レプリケーション

## 4. エラーハンドリング

### ローカルMCP

```typescript
try {
  const result = performOperation();
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  // stderrにログ出力
  console.error('Error:', error);
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
    isError: true,
  };
}
```

**特徴:**
- シンプルなエラーハンドリング
- Claude Desktopがログを収集
- プロセスクラッシュ時は自動再起動

### リモートMCP

```typescript
try {
  const result = performOperation();
  return { content: [{ type: 'text', text: JSON.stringify(result) }] };
} catch (error) {
  // 構造化ログ
  logger.error('Operation failed', {
    error: error.message,
    stack: error.stack,
    userId: req.user?.id,
    timestamp: new Date().toISOString(),
  });

  // HTTPステータスコードも考慮
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: error.message }) }],
    isError: true,
  };
}
```

**特徴:**
- 構造化ログ
- エラー追跡（Sentry等）
- メトリクス収集
- アラート設定

## 5. デプロイとスケーリング

### ローカルMCP

```bash
# ビルド
npm run build

# Claude Desktopが自動起動
# デプロイ不要
```

**スケーリング:**
- 単一プロセス
- 垂直スケールのみ（マシンスペック）
- 複数ユーザーには不向き

### リモートMCP（Express）

```bash
# ビルド
npm run build

# デプロイ（Railway例）
railway up

# スケーリング
railway scale --replicas 3
```

**スケーリング:**
- 水平スケール可能
- ロードバランサー
- 複数インスタンス
- オートスケーリング

### リモートMCP（Cloudflare Workers）

```bash
# デプロイ
wrangler deploy

# スケーリング
# 自動！設定不要
```

**スケーリング:**
- 自動グローバルスケール
- エッジロケーション
- 無制限の同時接続
- ゼロ設定

## 6. コストとパフォーマンス

### ローカルMCP

**コスト:**
- 無料（ローカルリソースのみ）

**パフォーマンス:**
- レイテンシ: < 1ms
- スループット: 高い
- リソース: ローカルマシン依存

### リモートMCP（Express）

**コスト:**
- VPS: $5-50/月
- Railway: $5-20/月
- Render: $7-25/月

**パフォーマンス:**
- レイテンシ: 10-100ms（地理的距離依存）
- スループット: 中程度
- リソース: プロビジョニング必要

### リモートMCP（Cloudflare Workers）

**コスト:**
- 無料枠: 10万リクエスト/日
- 有料: $5/月 + 従量課金

**パフォーマンス:**
- レイテンシ: 5-50ms（エッジ最適化）
- スループット: 非常に高い
- リソース: 無限（自動スケール）

## 7. 開発体験

### ローカルMCP

```bash
# 開発
npm run dev:local

# テスト
# Claude Desktopから直接テスト

# デバッグ
# console.logでstderrに出力
```

**開発体験:**
- 簡単なセットアップ
- 高速なイテレーション
- デバッグが容易

### リモートMCP

```bash
# 開発
npm run dev:remote

# テスト
curl -H "Authorization: Bearer key" http://localhost:3000/health

# デバッグ
# ログ、メトリクス、トレーシング
```

**開発体験:**
- 複雑なセットアップ
- 本番環境に近い
- 高度なツールが必要

## 8. 選択ガイド

### ローカルMCPを選ぶ場合

✅ 個人利用
✅ 機密データの処理
✅ オフライン環境
✅ シンプルなツール
✅ 開発・プロトタイピング

### リモートMCPを選ぶ場合

✅ チーム利用
✅ 複数デバイス
✅ 高度な認証
✅ スケーラビリティ
✅ リモートリソースアクセス
✅ エンタープライズ環境

## まとめ

| 側面 | ローカル | リモート |
|------|---------|---------|
| 複雑さ | 低 | 高 |
| コスト | 無料 | 有料 |
| セキュリティ | OS依存 | 実装が必要 |
| スケール | 単一 | 複数 |
| レイテンシ | 最小 | 高い |
| 柔軟性 | 低 | 高 |

適切な選択は、ユースケース、チームの規模、セキュリティ要件によって異なります。

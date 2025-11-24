# MCPクライアント - TypeScript版

MCPサーバーに接続してツールを呼び出すクライアント実装のサンプルです。

## 📋 提供されるクライアント

1. **ローカルクライアント** (`src/local-client.ts`)
   - stdio経由でローカルMCPサーバーに接続
   - すべてのツールを順番にテスト

2. **リモートクライアント** (`src/remote-client.ts`)
   - HTTP/SSE経由でリモートMCPサーバーに接続
   - APIキー認証対応
   - 包括的なツールテスト

3. **インタラクティブCLI** (`src/interactive.ts`)
   - 対話型インターフェース
   - ローカル/リモート両方に対応
   - REPLスタイルのコマンド実行

4. **サンプルスクリプト** (`examples/`)
   - 計算機ツールの使用例
   - ストレージツールの使用例

## 🚀 クイックスタート

### インストール

```bash
cd client

# 依存関係のインストール（ルートディレクトリで実行済みの場合は不要）
npm install
```

### ローカルクライアントの実行

```bash
# サーバーを事前に起動しておく必要はありません
# クライアントが自動的にサーバーを起動します
npm run local
```

### リモートクライアントの実行

```bash
# 1. リモートサーバーを起動
cd ../
npm run dev:remote

# 2. 別のターミナルで
cd client
cp .env.example .env
# .envファイルでAPI_KEYを設定

npm run remote
```

### インタラクティブCLIの実行

```bash
npm run interactive
```

使用例:
```
> connect local
> list
> call calculator {"operation":"add","a":10,"b":5}
> call storage_set {"key":"test","value":"hello"}
> call storage_get {"key":"test"}
> examples
> help
> exit
```

## 📝 使用例

### 計算機ツール

```bash
npm run example:calculator
```

### ストレージツール

```bash
npm run example:storage
```

## 💻 プログラムから使用

### ローカルサーバーへの接続

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const transport = new StdioClientTransport({
  command: 'node',
  args: ['path/to/server.js'],
});

const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);

// ツールの一覧
const tools = await client.listTools();

// ツールの実行
const result = await client.callTool({
  name: 'calculator',
  arguments: { operation: 'add', a: 10, b: 5 },
});

await client.close();
```

### リモートサーバーへの接続

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

const transport = new SSEClientTransport(
  new URL('http://localhost:3000/sse'),
  {
    headers: { Authorization: 'Bearer your-api-key' },
  }
);

const client = new Client(
  { name: 'my-client', version: '1.0.0' },
  { capabilities: {} }
);

await client.connect(transport);

// ツールの実行
const result = await client.callTool({
  name: 'storage_set',
  arguments: { key: 'name', value: 'Alice' },
});

await client.close();
```

## 🔧 利用可能なツール

すべてのクライアントから以下のツールが利用できます：

### calculator
四則演算を実行
```json
{
  "operation": "add|subtract|multiply|divide",
  "a": 10,
  "b": 5
}
```

### storage_set
キーバリューストアにデータを保存
```json
{
  "key": "my-key",
  "value": "my-value"
}
```

### storage_get
キーからデータを取得
```json
{
  "key": "my-key"
}
```

### storage_delete
キーを削除
```json
{
  "key": "my-key"
}
```

### storage_list
すべてのキーバリューを一覧表示
```json
{}
```

### system_info
システム情報を取得
```json
{}
```

### echo
メッセージをエコーバック（デバッグ用）
```json
{
  "message": "Hello!"
}
```

## 🐛 トラブルシューティング

### ローカルクライアントが動作しない

- サーバーのビルドが完了しているか確認: `npm run build`
- パスが正しいか確認

### リモートクライアントが接続できない

- サーバーが起動しているか確認
- `.env`ファイルのAPI_KEYが正しいか確認
- URLが正しいか確認（デフォルト: `http://localhost:3000/sse`）

### 認証エラー

- サーバー側の`.env`ファイルでAPI_KEYが設定されているか確認
- クライアント側の`.env`ファイルのAPI_KEYが一致しているか確認
- `Bearer `プレフィックスが正しく付いているか確認

## 📚 参考

- [MCP SDK ドキュメント](https://github.com/modelcontextprotocol/sdk)
- メインREADME: `../README.md`
- サーバー実装: `../src/`

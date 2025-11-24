# MCP Chat UI

WebベースのチャットインターフェースでMCPサーバーと対話できるアプリケーションです。

## 🎯 特徴

- 💬 **チャット形式のUI** - 直感的な対話型インターフェース
- 🔧 **ツール選択** - ドロップダウンから簡単にツールを選択
- ⚡ **クイックアクション** - よく使うツールをワンクリック実行
- 🎨 **モダンなデザイン** - Tailwind CSSによる美しいUI
- 🔄 **リアルタイム更新** - メッセージの即時表示
- 📱 **レスポンシブ** - モバイル対応

## 🚀 セットアップ

### 前提条件

- Node.js 18以上
- MCPサーバー（ローカルまたはリモート）が起動していること

### インストール

```bash
cd chat-ui

# 依存関係のインストール
npm install

# .envファイルの作成
cp .env.example .env

# .envファイルを編集してサーバーURLとAPIキーを設定
```

### 起動

```bash
# 開発モード
npm run dev

# ブラウザで開く
# http://localhost:3000
```

## 📝 使い方

### 1. サーバーへの接続

アプリケーションを開くと、自動的にMCPサーバーに接続します。
接続状態はヘッダー右上のインジケーターで確認できます：

- 🟢 緑: 接続中
- 🔴 赤: 未接続

### 2. ツールの選択

ドロップダウンメニューから使用したいツールを選択します：

- **calculator** - 計算機能
- **storage_set/get/delete/list** - ストレージ操作
- **system_info** - システム情報
- **echo** - エコー（デバッグ用）

### 3. パラメータの入力

テキストエリアにJSON形式でパラメータを入力します：

```json
{
  "operation": "add",
  "a": 10,
  "b": 5
}
```

### 4. 実行

「送信」ボタンをクリックするか、`Ctrl+Enter`で実行します。

### 5. クイックアクション

よく使う操作はクイックアクションボタンから実行できます：

- 🧮 **計算例** - 10 + 5 の計算
- 💾 **保存例** - テストデータの保存
- 💻 **システム情報** - サーバーの情報取得
- 📢 **エコー** - エコーテスト

## 🔧 設定

### 環境変数

`.env`ファイルで以下の設定ができます：

```env
# MCPサーバーのURL
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3000/sse

# APIキー（リモートサーバー用）
MCP_API_KEY=your-api-key-here
```

## 💡 使用例

### 計算を実行

1. ツール選択: `calculator`
2. パラメータ:
```json
{
  "operation": "multiply",
  "a": 12,
  "b": 8
}
```
3. 送信

結果:
```json
{
  "result": 96,
  "operation": "12 multiply 8 = 96"
}
```

### データを保存

1. ツール選択: `storage_set`
2. パラメータ:
```json
{
  "key": "username",
  "value": "Alice"
}
```
3. 送信

### データを取得

1. ツール選択: `storage_get`
2. パラメータ:
```json
{
  "key": "username"
}
```
3. 送信

## 🏗️ アーキテクチャ

```
chat-ui/
├── src/
│   ├── app/
│   │   ├── api/mcp/          # APIルート
│   │   │   ├── connect/      # 接続API
│   │   │   └── call-tool/    # ツール実行API
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ChatInterface.tsx # メインチャットコンポーネント
│   └── lib/
│       └── mcp-client.ts     # MCPクライアントロジック
├── package.json
└── README.md
```

## 🎨 カスタマイズ

### デザインの変更

`tailwind.config.js`でカラーテーマを変更できます：

```js
theme: {
  extend: {
    colors: {
      primary: '#0070f3',   // プライマリカラー
      secondary: '#7928ca', // セカンダリカラー
    },
  },
}
```

### 新しいクイックアクションの追加

`ChatInterface.tsx`の`handleQuickAction`を使用：

```tsx
<button
  onClick={() =>
    handleQuickAction('your_tool', { param: 'value' })
  }
  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
>
  🔧 カスタムアクション
</button>
```

## 🐛 トラブルシューティング

### 接続できない

- MCPサーバーが起動しているか確認
- `.env`のURLが正しいか確認
- CORSエラーの場合、サーバー側のCORS設定を確認

### ツールが実行できない

- JSONフォーマットが正しいか確認
- 必須パラメータが含まれているか確認
- サーバーのログでエラーを確認

### 画面が表示されない

```bash
# 依存関係を再インストール
rm -rf node_modules .next
npm install
npm run dev
```

## 📚 技術スタック

- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **MCP SDK** - Model Context Protocol通信
- **Server Components & API Routes** - バックエンド

## 🔗 関連リンク

- メインREADME: `../README.md`
- MCPサーバー実装: `../src/`
- MCPクライアント実装: `../client/`

## ライセンス

MIT

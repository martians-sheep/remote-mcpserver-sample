# Rust MCP Server Implementation

Rust言語によるMCP (Model Context Protocol) サーバーの実装サンプルです。

## 🎯 特徴

- 📡 **Local Server (stdio)** - 標準入出力による通信
- 🌐 **Remote Server (HTTP/SSE)** - Axumを使用したServer-Sent Events通信
- 🔧 **共通ツール実装** - TypeScript/Python/Go版と同じツールセット
- ⚡ **最高のパフォーマンス** - Rustのゼロコスト抽象化と所有権システム
- 🔒 **メモリ安全性** - コンパイル時のメモリ安全保証
- 🚀 **非同期I/O** - Tokioによる効率的な非同期処理

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

- Rust 1.75以上（2021 edition）
- Cargo

### インストール

```bash
cd rust

# 依存関係のダウンロード（自動）
cargo build
```

## 🔧 使い方

### 1. Local Server (stdio)

```bash
# ビルド＆実行（デバッグモード）
cargo run --bin mcp-local

# リリースビルド
cargo build --release --bin mcp-local
./target/release/mcp-local
```

Claude Desktopの設定:
```json
{
  "mcpServers": {
    "rust-mcp-local": {
      "command": "/absolute/path/to/rust/target/release/mcp-local"
    }
  }
}
```

### 2. Remote Server (HTTP/SSE)

```bash
# .envファイルを作成
cp .env.example .env

# APIキーを設定
echo "MCP_API_KEY=your-secret-key" >> .env

# ビルド＆実行
cargo run --bin mcp-remote

# リリースビルド
cargo build --release --bin mcp-remote
./target/release/mcp-remote
```

Claude Desktopの設定:
```json
{
  "mcpServers": {
    "rust-mcp-remote": {
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
```

## 🏗️ プロジェクト構造

```
rust/
├── Cargo.toml          # ワークスペース設定
├── mcp-core/           # コアライブラリ
│   ├── src/
│   │   ├── lib.rs
│   │   ├── types.rs    # MCP型定義
│   │   ├── server.rs   # サーバーロジック
│   │   └── tools/      # ツール実装
│   │       ├── mod.rs
│   │       ├── calculator.rs
│   │       ├── storage.rs
│   │       ├── system.rs
│   │       └── echo.rs
│   └── Cargo.toml
├── mcp-local/          # Localサーバー (stdio)
│   ├── src/
│   │   └── main.rs
│   └── Cargo.toml
├── mcp-remote/         # Remoteサーバー (Axum + SSE)
│   ├── src/
│   │   └── main.rs
│   └── Cargo.toml
└── README.md
```

## 🔍 他言語版との違い

### メリット
- ⚡ **最高のパフォーマンス** - C/C++並みの実行速度
- 🔒 **メモリ安全性** - コンパイル時の所有権チェック
- 📦 **単一バイナリ** - 依存関係なしでデプロイ可能
- 🔄 **並行処理** - async/awaitによる効率的な非同期処理
- 💪 **型安全** - 強力な型システム
- 💾 **低メモリ** - 最小限のメモリフットプリント

### 注意点
- ⚠️ **公式SDKなし** - MCP公式Rust SDKは未提供のため独自実装
- 🔧 **学習曲線** - 所有権システムの理解が必要
- ⏱️ **コンパイル時間** - 初回ビルドに時間がかかる

## 🧪 テスト

```bash
# ユニットテスト
cargo test

# カバレッジ
cargo tarpaulin

# ベンチマーク
cargo bench
```

## 📦 ビルド

```bash
# デバッグビルド
cargo build

# リリースビルド（最適化）
cargo build --release

# 特定プラットフォーム向けクロスコンパイル
cargo build --release --target x86_64-unknown-linux-gnu
cargo build --release --target x86_64-apple-darwin
cargo build --release --target x86_64-pc-windows-gnu
```

## 🚀 デプロイ

### Docker

```dockerfile
FROM rust:1.75 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release --bin mcp-remote

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/mcp-remote /usr/local/bin/
EXPOSE 8080
CMD ["mcp-remote"]
```

### Railway / Render

`Procfile`:
```
web: ./target/release/mcp-remote
```

ビルドコマンド:
```bash
cargo build --release --bin mcp-remote
```

## 📊 パフォーマンス

Rustの特徴:
- 🚀 **起動時間**: Go並みの高速起動
- ⚡ **実行速度**: C/C++に匹敵
- 💾 **メモリ使用量**: 最小限（< 10MB）
- 🔄 **並行処理**: Tokioによる高効率

## 🔗 関連リンク

- TypeScript版: `../src/`
- Python版: `../python/`
- Go版: `../go/`
- クライアント: `../client/`
- Chat UI: `../chat-ui/`
- Rust公式: https://www.rust-lang.org/
- Tokio: https://tokio.rs/
- Axum: https://github.com/tokio-rs/axum

## ライセンス

MIT

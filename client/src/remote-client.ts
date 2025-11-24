#!/usr/bin/env node
/**
 * リモートMCPクライアント
 * HTTP/SSE経由でリモートMCPサーバーに接続
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import dotenv from 'dotenv';

dotenv.config();

const REMOTE_SERVER_URL = process.env.REMOTE_SERVER_URL || 'http://localhost:3000/sse';
const API_KEY = process.env.API_KEY || '';

async function main() {
  console.log('🌐 リモートMCPサーバーに接続中...');
  console.log(`URL: ${REMOTE_SERVER_URL}\n`);

  if (!API_KEY) {
    console.warn('⚠️  警告: API_KEYが設定されていません');
  }

  // クライアントの作成
  const transport = new SSEClientTransport(new URL(REMOTE_SERVER_URL), {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
    },
  });

  const client = new Client(
    {
      name: 'mcp-remote-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  try {
    // サーバーに接続
    await client.connect(transport);
    console.log('✅ 接続成功！\n');

    // 利用可能なツールを取得
    const tools = await client.listTools();
    console.log('📋 利用可能なツール:');
    tools.tools.forEach((tool) => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    // 計算機ツールのテスト
    console.log('🧮 計算機ツールをテスト...');
    const calcTests = [
      { operation: 'add', a: 15, b: 7 },
      { operation: 'subtract', a: 20, b: 8 },
      { operation: 'multiply', a: 6, b: 7 },
      { operation: 'divide', a: 100, b: 4 },
    ];

    for (const test of calcTests) {
      const result = await client.callTool({
        name: 'calculator',
        arguments: test,
      });
      console.log(`  ${test.a} ${test.operation} ${test.b} =`, result.content[0]);
    }
    console.log();

    // ストレージツールのテスト
    console.log('💾 ストレージツールをテスト...');

    // 複数のデータを保存
    const testData = [
      { key: 'name', value: 'Alice' },
      { key: 'age', value: '30' },
      { key: 'city', value: 'Tokyo' },
    ];

    for (const data of testData) {
      await client.callTool({
        name: 'storage_set',
        arguments: data,
      });
      console.log(`  ✅ 保存: ${data.key} = ${data.value}`);
    }
    console.log();

    // データを取得
    console.log('📖 データを取得中...');
    for (const data of testData) {
      const result = await client.callTool({
        name: 'storage_get',
        arguments: { key: data.key },
      });
      console.log(`  ${data.key}:`, result.content[0]);
    }
    console.log();

    // 一覧表示
    console.log('📃 ストレージ一覧:');
    const listResult = await client.callTool({
      name: 'storage_list',
      arguments: {},
    });
    console.log(listResult.content[0]);
    console.log();

    // システム情報の取得
    console.log('💻 システム情報を取得中...');
    const sysInfo = await client.callTool({
      name: 'system_info',
      arguments: {},
    });
    console.log(sysInfo.content[0]);
    console.log();

    // エコーツールのテスト
    console.log('📢 エコーツールをテスト...');
    const messages = [
      'Hello, Remote MCP!',
      'Testing from client',
      'リモート接続テスト',
    ];

    for (const msg of messages) {
      const result = await client.callTool({
        name: 'echo',
        arguments: { message: msg },
      });
      console.log(`  ${msg} =>`, result.content[0]);
    }
    console.log();

    // データのクリーンアップ
    console.log('🧹 クリーンアップ中...');
    for (const data of testData) {
      await client.callTool({
        name: 'storage_delete',
        arguments: { key: data.key },
      });
      console.log(`  🗑️  削除: ${data.key}`);
    }
    console.log();

    console.log('🎉 すべてのテストが完了しました！');

    // クリーンアップ
    await client.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ エラー:', error);
    if (error instanceof Error) {
      console.error('詳細:', error.message);
      if (error.message.includes('401')) {
        console.error('\n💡 ヒント: API_KEYを確認してください');
      }
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ 予期しないエラー:', error);
  process.exit(1);
});

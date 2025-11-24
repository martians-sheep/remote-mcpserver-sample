#!/usr/bin/env node
/**
 * ローカルMCPクライアント
 * stdio経由でローカルMCPサーバーに接続
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function main() {
  console.log('🔌 ローカルMCPサーバーに接続中...\n');

  // サーバープロセスの起動
  const serverProcess = spawn('node', ['../dist/local/server.js'], {
    cwd: __dirname,
  });

  // クライアントの作成
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/local/server.js'],
  });

  const client = new Client(
    {
      name: 'mcp-local-client',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

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
  const calcResult = await client.callTool({
    name: 'calculator',
    arguments: {
      operation: 'add',
      a: 10,
      b: 5,
    },
  });
  console.log('結果:', calcResult.content[0]);
  console.log();

  // ストレージツールのテスト
  console.log('💾 ストレージツールをテスト...');

  // 保存
  await client.callTool({
    name: 'storage_set',
    arguments: {
      key: 'test-key',
      value: 'Hello from MCP Client!',
    },
  });
  console.log('✅ データを保存しました');

  // 取得
  const getResult = await client.callTool({
    name: 'storage_get',
    arguments: {
      key: 'test-key',
    },
  });
  console.log('取得したデータ:', getResult.content[0]);
  console.log();

  // 一覧
  const listResult = await client.callTool({
    name: 'storage_list',
    arguments: {},
  });
  console.log('ストレージ一覧:', listResult.content[0]);
  console.log();

  // システム情報の取得
  console.log('💻 システム情報を取得中...');
  const sysInfo = await client.callTool({
    name: 'system_info',
    arguments: {},
  });
  console.log('システム情報:', sysInfo.content[0]);
  console.log();

  // エコーツールのテスト
  console.log('📢 エコーツールをテスト...');
  const echoResult = await client.callTool({
    name: 'echo',
    arguments: {
      message: 'Hello, MCP!',
    },
  });
  console.log('エコー結果:', echoResult.content[0]);
  console.log();

  console.log('🎉 すべてのテストが完了しました！');

  // クリーンアップ
  await client.close();
  serverProcess.kill();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ エラー:', error);
  process.exit(1);
});

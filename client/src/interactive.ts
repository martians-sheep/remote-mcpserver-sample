#!/usr/bin/env node
/**
 * インタラクティブMCPクライアント
 * 対話型インターフェースでMCPサーバーを操作
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as readline from 'readline/promises';
import dotenv from 'dotenv';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let client: Client | null = null;

async function connectLocal() {
  console.log('\n🔌 ローカルサーバーに接続中...');
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/local/server.js'],
  });

  client = new Client({ name: 'interactive-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  console.log('✅ 接続成功！\n');
}

async function connectRemote(url: string, apiKey: string) {
  console.log(`\n🌐 リモートサーバーに接続中: ${url}`);
  const transport = new SSEClientTransport(new URL(url), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  client = new Client({ name: 'interactive-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  console.log('✅ 接続成功！\n');
}

async function listTools() {
  if (!client) {
    console.log('❌ サーバーに接続していません');
    return;
  }

  const tools = await client.listTools();
  console.log('\n📋 利用可能なツール:');
  tools.tools.forEach((tool, index) => {
    console.log(`\n${index + 1}. ${tool.name}`);
    console.log(`   説明: ${tool.description}`);
    console.log(`   入力: ${JSON.stringify(tool.inputSchema, null, 2)}`);
  });
}

async function callTool(name: string, args: any) {
  if (!client) {
    console.log('❌ サーバーに接続していません');
    return;
  }

  try {
    console.log(`\n🔧 ツール実行中: ${name}`);
    console.log(`引数: ${JSON.stringify(args, null, 2)}`);

    const result = await client.callTool({ name, arguments: args });

    console.log('\n✅ 結果:');
    result.content.forEach((content) => {
      if (content.type === 'text') {
        try {
          const parsed = JSON.parse(content.text);
          console.log(JSON.stringify(parsed, null, 2));
        } catch {
          console.log(content.text);
        }
      }
    });
  } catch (error) {
    console.error('❌ エラー:', error instanceof Error ? error.message : error);
  }
}

async function showHelp() {
  console.log('\n📖 使用可能なコマンド:');
  console.log('  connect local          - ローカルサーバーに接続');
  console.log('  connect remote <url>   - リモートサーバーに接続');
  console.log('  list                   - 利用可能なツールを表示');
  console.log('  call <tool> <json>     - ツールを実行');
  console.log('  examples               - サンプルコマンドを表示');
  console.log('  help                   - このヘルプを表示');
  console.log('  exit                   - 終了');
}

async function showExamples() {
  console.log('\n💡 サンプルコマンド:');
  console.log('');
  console.log('  計算:');
  console.log('    call calculator {"operation":"add","a":10,"b":5}');
  console.log('');
  console.log('  ストレージ保存:');
  console.log('    call storage_set {"key":"name","value":"Alice"}');
  console.log('');
  console.log('  ストレージ取得:');
  console.log('    call storage_get {"key":"name"}');
  console.log('');
  console.log('  ストレージ一覧:');
  console.log('    call storage_list {}');
  console.log('');
  console.log('  システム情報:');
  console.log('    call system_info {}');
  console.log('');
  console.log('  エコー:');
  console.log('    call echo {"message":"Hello!"}');
}

async function main() {
  console.log('🎯 インタラクティブMCPクライアント');
  console.log('===============================\n');
  await showHelp();

  while (true) {
    const input = await rl.question('\n> ');
    const parts = input.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();

    try {
      switch (command) {
        case 'connect':
          if (parts[1] === 'local') {
            await connectLocal();
          } else if (parts[1] === 'remote') {
            const url = parts[2] || process.env.REMOTE_SERVER_URL || 'http://localhost:3000/sse';
            const apiKey = process.env.API_KEY || '';
            await connectRemote(url, apiKey);
          } else {
            console.log('❌ 使用方法: connect local | connect remote [url]');
          }
          break;

        case 'list':
          await listTools();
          break;

        case 'call':
          if (parts.length < 3) {
            console.log('❌ 使用方法: call <tool-name> <json-args>');
            break;
          }
          const toolName = parts[1];
          const argsJson = parts.slice(2).join(' ');
          try {
            const args = JSON.parse(argsJson);
            await callTool(toolName, args);
          } catch (error) {
            console.error('❌ JSON解析エラー:', error);
          }
          break;

        case 'examples':
          await showExamples();
          break;

        case 'help':
          await showHelp();
          break;

        case 'exit':
        case 'quit':
          console.log('\n👋 終了します...');
          if (client) {
            await client.close();
          }
          rl.close();
          process.exit(0);

        case '':
          break;

        default:
          console.log(`❌ 不明なコマンド: ${command}`);
          console.log('💡 "help" でヘルプを表示');
      }
    } catch (error) {
      console.error('❌ エラー:', error instanceof Error ? error.message : error);
    }
  }
}

main().catch((error) => {
  console.error('❌ 致命的エラー:', error);
  process.exit(1);
});

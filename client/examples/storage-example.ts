/**
 * ストレージツールの使用例
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('💾 ストレージツールのサンプル\n');

  const url = process.env.REMOTE_SERVER_URL || 'http://localhost:3000/sse';
  const apiKey = process.env.API_KEY || '';

  const transport = new SSEClientTransport(new URL(url), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const client = new Client({ name: 'storage-example', version: '1.0.0' }, { capabilities: {} });

  await client.connect(transport);
  console.log('✅ サーバーに接続しました\n');

  // ユーザープロファイルを保存
  console.log('📝 ユーザープロファイルを保存中...');
  const userProfile = {
    name: 'Alice Johnson',
    email: 'alice@example.com',
    role: 'Developer',
    location: 'Tokyo',
  };

  for (const [key, value] of Object.entries(userProfile)) {
    await client.callTool({
      name: 'storage_set',
      arguments: { key, value },
    });
    console.log(`  ✅ ${key}: ${value}`);
  }

  console.log('\n📖 保存したデータを取得中...');
  for (const key of Object.keys(userProfile)) {
    const result = await client.callTool({
      name: 'storage_get',
      arguments: { key },
    });

    const resultText = result.content[0];
    if (resultText.type === 'text') {
      const data = JSON.parse(resultText.text);
      console.log(`  ${key}:`, data.value);
    }
  }

  // すべてのデータを一覧表示
  console.log('\n📃 ストレージ内の全データ:');
  const listResult = await client.callTool({
    name: 'storage_list',
    arguments: {},
  });

  const listText = listResult.content[0];
  if (listText.type === 'text') {
    const data = JSON.parse(listText.text);
    console.log(`  合計: ${data.count}件`);
    data.items.forEach((item: any) => {
      console.log(`  - ${item.key}: ${item.value}`);
    });
  }

  // データを1つ削除
  console.log('\n🗑️  データを削除中...');
  await client.callTool({
    name: 'storage_delete',
    arguments: { key: 'email' },
  });
  console.log('  ✅ email を削除しました');

  // 削除後の一覧
  console.log('\n📃 削除後のデータ:');
  const finalList = await client.callTool({
    name: 'storage_list',
    arguments: {},
  });

  const finalText = finalList.content[0];
  if (finalText.type === 'text') {
    const data = JSON.parse(finalText.text);
    console.log(`  合計: ${data.count}件`);
  }

  await client.close();
  console.log('\n✅ 完了しました！');
}

main().catch(console.error);

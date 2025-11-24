/**
 * 計算機ツールの使用例
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🧮 計算機ツールのサンプル\n');

  const url = process.env.REMOTE_SERVER_URL || 'http://localhost:3000/sse';
  const apiKey = process.env.API_KEY || '';

  const transport = new SSEClientTransport(new URL(url), {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const client = new Client({ name: 'calculator-example', version: '1.0.0' }, { capabilities: {} });

  await client.connect(transport);
  console.log('✅ サーバーに接続しました\n');

  // 様々な計算を実行
  const calculations = [
    { operation: 'add', a: 100, b: 50, description: '足し算' },
    { operation: 'subtract', a: 100, b: 30, description: '引き算' },
    { operation: 'multiply', a: 12, b: 8, description: '掛け算' },
    { operation: 'divide', a: 144, b: 12, description: '割り算' },
  ];

  for (const calc of calculations) {
    console.log(`${calc.description}: ${calc.a} ${calc.operation} ${calc.b}`);

    const result = await client.callTool({
      name: 'calculator',
      arguments: {
        operation: calc.operation,
        a: calc.a,
        b: calc.b,
      },
    });

    const resultText = result.content[0];
    if (resultText.type === 'text') {
      const data = JSON.parse(resultText.text);
      console.log(`結果: ${data.result}`);
      console.log(`詳細: ${data.operation}\n`);
    }
  }

  // エラーハンドリングの例
  console.log('エラー例: ゼロ除算');
  try {
    await client.callTool({
      name: 'calculator',
      arguments: {
        operation: 'divide',
        a: 10,
        b: 0,
      },
    });
  } catch (error) {
    console.log('❌ エラーが検出されました:', error);
  }

  await client.close();
  console.log('\n✅ 完了しました！');
}

main().catch(console.error);

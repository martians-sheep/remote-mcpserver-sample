#!/usr/bin/env node

/**
 * ローカルMCPサーバー（stdio版）
 *
 * 特徴:
 * - stdioを通じた通信（プロセス間通信）
 * - 認証不要（ローカル実行のため）
 * - シンプルな起動方法
 * - Claude Desktopから直接プロセスとして起動される
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// 共通ツールのインポート
import {
  calculatorToolDefinition,
  calculate,
  CalculatorSchema,
  storageToolDefinitions,
  SimpleStorage,
  SetSchema,
  GetSchema,
  DeleteSchema,
  systemInfoToolDefinition,
  getSystemInfo,
  echoToolDefinition,
  echo,
  EchoSchema,
} from '../shared/tools/index.js';

import { logger } from '../utils/logger.js';

// ストレージのインスタンス
const storage = new SimpleStorage();

// MCPサーバーの作成
const server = new Server(
  {
    name: 'local-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツール一覧の登録
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      calculatorToolDefinition,
      storageToolDefinitions.set,
      storageToolDefinitions.get,
      storageToolDefinitions.delete,
      storageToolDefinitions.list,
      systemInfoToolDefinition,
      echoToolDefinition,
    ],
  };
});

// ツール実行の処理
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'calculator': {
        const params = CalculatorSchema.parse(args);
        const result = calculate(params);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'storage_set': {
        const params = SetSchema.parse(args);
        const result = storage.set(params.key, params.value);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'storage_get': {
        const params = GetSchema.parse(args);
        const result = storage.get(params.key);
        if (!result) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({ error: 'Key not found' }),
              },
            ],
            isError: true,
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'storage_delete': {
        const params = DeleteSchema.parse(args);
        const deleted = storage.delete(params.key);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ deleted, key: params.key }),
            },
          ],
        };
      }

      case 'storage_list': {
        const items = storage.list();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ items, count: items.length }, null, 2),
            },
          ],
        };
      }

      case 'system_info': {
        const info = getSystemInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      case 'echo': {
        const params = EchoSchema.parse(args);
        const result = echo(params.message);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Error executing tool ${name}:`, errorMessage);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: errorMessage }),
        },
      ],
      isError: true,
    };
  }
});

// サーバーの起動
async function main() {
  logger.info('Starting Local MCP Server (stdio)...');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('Local MCP Server is running');
  logger.info('Communication: stdio');
  logger.info('Authentication: None (local execution)');
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

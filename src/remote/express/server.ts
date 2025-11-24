#!/usr/bin/env node

/**
 * リモートMCPサーバー（Express/HTTP版）
 *
 * 特徴:
 * - HTTP/SSEを通じた通信
 * - APIキー認証が必要
 * - CORS設定が必要
 * - レート制限の実装
 * - ヘルスチェックエンドポイント
 * - 環境変数による設定
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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
} from '../../shared/tools/index.js';

import { logger } from '../../utils/logger.js';
import { validateApiKey, extractBearerToken } from '../../utils/auth.js';

// 環境変数の読み込み
dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const API_KEY = process.env.API_KEY || '';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

// Expressアプリの作成
const app = express();

// CORSの設定（リモートアクセス用）
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

// レート制限の設定（DoS攻撃対策）
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15分
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json());

// ストレージのインスタンス（各接続で共有）
const storage = new SimpleStorage();

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// メトリクスエンドポイント
app.get('/metrics', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  const authContext = validateApiKey(token, API_KEY);

  if (!authContext.isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  res.json({
    storageItems: storage.size(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime(),
  });
});

// MCPサーバーのファクトリ関数
function createMCPServer() {
  const server = new Server(
    {
      name: 'remote-mcp-server-express',
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

  return server;
}

// MCP SSEエンドポイント
app.get('/sse', async (req, res) => {
  logger.info('New SSE connection request');

  // 認証チェック
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  const authContext = validateApiKey(token, API_KEY);

  if (!authContext.isAuthenticated) {
    logger.warn('Unauthorized SSE connection attempt');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  logger.info('SSE connection authenticated');

  // MCPサーバーのインスタンスを作成
  const server = createMCPServer();
  const transport = new SSEServerTransport('/message', res);

  await server.connect(transport);
  logger.info('MCP Server connected via SSE');
});

// MCPメッセージエンドポイント
app.post('/message', async (req, res) => {
  // 認証チェック
  const authHeader = req.headers.authorization;
  const token = extractBearerToken(authHeader);
  const authContext = validateApiKey(token, API_KEY);

  if (!authContext.isAuthenticated) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // SSEトランスポートがメッセージを処理
  // 注: 実際の処理はSSEトランスポート内で行われる
  res.status(200).end();
});

// ルートエンドポイント
app.get('/', (req, res) => {
  res.json({
    name: 'Remote MCP Server (Express)',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      metrics: '/metrics',
      sse: '/sse',
      message: '/message',
    },
    authentication: 'Bearer token required',
    documentation: 'https://github.com/modelcontextprotocol',
  });
});

// サーバーの起動
async function main() {
  if (!API_KEY) {
    logger.warn('WARNING: API_KEY is not set. Authentication is disabled.');
    logger.warn('Set API_KEY in .env file for production use.');
  }

  app.listen(PORT, () => {
    logger.info('='.repeat(60));
    logger.info('Remote MCP Server (Express) is running');
    logger.info('='.repeat(60));
    logger.info(`Port: ${PORT}`);
    logger.info(`Communication: HTTP/SSE`);
    logger.info(`Authentication: ${API_KEY ? 'Enabled (API Key)' : 'Disabled'}`);
    logger.info(`CORS Origins: ${ALLOWED_ORIGINS.join(', ')}`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`SSE endpoint: http://localhost:${PORT}/sse`);
    logger.info('='.repeat(60));
  });
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

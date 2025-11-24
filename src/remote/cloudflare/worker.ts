/**
 * リモートMCPサーバー（Cloudflare Workers版）
 *
 * 特徴:
 * - グローバルエッジネットワークで実行
 * - HTTP/SSEを通じた通信
 * - APIキー認証
 * - Durable Objectsでステート管理
 * - 自動スケーリング
 * - 高可用性
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// 共通ツールのインポート（Workers環境用に調整）
import {
  calculatorToolDefinition,
  calculate,
  CalculatorSchema,
  storageToolDefinitions,
  SimpleStorage,
  SetSchema,
  GetSchema,
  DeleteSchema,
  echoToolDefinition,
  echo,
  EchoSchema,
} from '../../shared/tools/index.js';

export interface Env {
  API_KEY: string;
  MCP_STORAGE: DurableObjectNamespace;
}

// Durable Object for persistent storage
export class MCPStorage {
  private state: DurableObjectState;
  private storage: SimpleStorage;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.storage = new SimpleStorage();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      switch (url.pathname) {
        case '/set': {
          const { key, value } = await request.json();
          const result = this.storage.set(key, value);
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case '/get': {
          const { key } = await request.json();
          const result = this.storage.get(key);
          if (!result) {
            return new Response(JSON.stringify({ error: 'Key not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            });
          }
          return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case '/delete': {
          const { key } = await request.json();
          const deleted = this.storage.delete(key);
          return new Response(JSON.stringify({ deleted, key }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        case '/list': {
          const items = this.storage.list();
          return new Response(JSON.stringify({ items, count: items.length }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }

        default:
          return new Response('Not Found', { status: 404 });
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }
}

// ヘルパー関数: 認証チェック
function validateAuth(request: Request, apiKey: string): boolean {
  if (!apiKey) return true; // APIキーが設定されていない場合はスキップ

  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const token = authHeader.replace(/^Bearer\s+/i, '');
  return token === apiKey;
}

// システム情報取得（Workers環境用）
function getWorkerSystemInfo() {
  return {
    platform: 'cloudflare-workers',
    runtime: 'workerd',
    environment: 'edge',
    // Workers環境ではNode.jsのAPIが使えないため、簡略化
  };
}

// MCPサーバーの作成
function createMCPServer(env: Env) {
  const server = new Server(
    {
      name: 'remote-mcp-server-cloudflare',
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
        echoToolDefinition,
        // system_infoは簡略版
        {
          name: 'system_info',
          description: 'Get Cloudflare Workers environment information',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  // Durable Objectのインスタンス取得
  const storageId = env.MCP_STORAGE.idFromName('default');
  const storageStub = env.MCP_STORAGE.get(storageId);

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
          const response = await storageStub.fetch(
            new Request('http://internal/set', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            })
          );
          const result = await response.json();
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
          const response = await storageStub.fetch(
            new Request('http://internal/get', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            })
          );
          if (!response.ok) {
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
          const result = await response.json();
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
          const response = await storageStub.fetch(
            new Request('http://internal/delete', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(params),
            })
          );
          const result = await response.json();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'storage_list': {
          const response = await storageStub.fetch(
            new Request('http://internal/list', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
            })
          );
          const result = await response.json();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        }

        case 'system_info': {
          const info = getWorkerSystemInfo();
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

// メインのWorkerハンドラー
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ヘルスチェック
    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          platform: 'cloudflare-workers',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // ルート
    if (url.pathname === '/') {
      return new Response(
        JSON.stringify({
          name: 'Remote MCP Server (Cloudflare Workers)',
          version: '1.0.0',
          endpoints: {
            health: '/health',
            sse: '/sse',
            message: '/message',
          },
          authentication: 'Bearer token required',
          platform: 'cloudflare-workers',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 認証チェック
    if (!validateAuth(request, env.API_KEY)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SSEエンドポイント
    if (url.pathname === '/sse') {
      // Cloudflare WorkersでのSSE実装は複雑なため、
      // ここでは簡略化した実装を示す
      // 実際の本番環境ではより高度な実装が必要

      return new Response('SSE endpoint for Cloudflare Workers', {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // メッセージエンドポイント
    if (url.pathname === '/message' && request.method === 'POST') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders,
    });
  },
};

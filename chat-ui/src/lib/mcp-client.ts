/**
 * MCPクライアントロジック
 * サーバーサイドでMCPサーバーと通信
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';

let mcpClient: Client | null = null;
let mcpTransport: SSEClientTransport | null = null;

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
}

export interface MCPCallResult {
  success: boolean;
  result?: any;
  error?: string;
}

export async function connectToMCP(serverUrl: string, apiKey?: string): Promise<{
  success: boolean;
  tools?: MCPTool[];
  error?: string;
}> {
  try {
    // 既存の接続をクローズ
    if (mcpClient) {
      await mcpClient.close();
    }

    // 新しい接続を作成
    const headers: Record<string, string> = {};
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    mcpTransport = new SSEClientTransport(new URL(serverUrl), { headers });

    mcpClient = new Client(
      {
        name: 'mcp-chat-ui',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );

    await mcpClient.connect(mcpTransport);

    // ツール一覧を取得
    const toolsResponse = await mcpClient.listTools();

    return {
      success: true,
      tools: toolsResponse.tools.map((tool) => ({
        name: tool.name,
        description: tool.description || '',
        inputSchema: tool.inputSchema,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function callMCPTool(
  toolName: string,
  args: any
): Promise<MCPCallResult> {
  if (!mcpClient) {
    return {
      success: false,
      error: 'MCPサーバーに接続されていません',
    };
  }

  try {
    const result = await mcpClient.callTool({
      name: toolName,
      arguments: args,
    });

    // レスポンスをパース
    const content = result.content[0];
    if (content && 'text' in content) {
      try {
        const parsed = JSON.parse(content.text);
        return {
          success: true,
          result: parsed,
        };
      } catch {
        return {
          success: true,
          result: content.text,
        };
      }
    }

    return {
      success: true,
      result: content,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function disconnectMCP(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close();
    mcpClient = null;
    mcpTransport = null;
  }
}

export function isConnected(): boolean {
  return mcpClient !== null;
}

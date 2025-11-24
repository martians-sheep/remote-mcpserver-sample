/**
 * エコーツール（デバッグ用）
 * ローカル・リモート両方で使用する共通実装
 */

import { z } from 'zod';

export const EchoSchema = z.object({
  message: z.string(),
});

export interface EchoResult {
  echo: string;
  timestamp: string;
  length: number;
}

export function echo(message: string): EchoResult {
  return {
    echo: message,
    timestamp: new Date().toISOString(),
    length: message.length,
  };
}

export const echoToolDefinition = {
  name: 'echo',
  description: 'Echo back a message with timestamp (useful for testing)',
  inputSchema: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message to echo back',
      },
    },
    required: ['message'],
  },
};

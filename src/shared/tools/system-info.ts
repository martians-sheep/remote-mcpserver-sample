/**
 * システム情報ツール
 * ローカル・リモート両方で使用する共通実装
 */

import os from 'os';
import type { SystemInfo } from '../types/index.js';

export function getSystemInfo(): SystemInfo {
  const memUsage = process.memoryUsage();

  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    uptime: process.uptime(),
    memoryUsage: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
    },
  };
}

export const systemInfoToolDefinition = {
  name: 'system_info',
  description: 'Get system information including platform, architecture, Node.js version, and memory usage',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

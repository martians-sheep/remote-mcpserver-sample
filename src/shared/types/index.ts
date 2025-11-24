/**
 * 共通の型定義
 */

export interface StorageItem {
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  nodeVersion: string;
  uptime: number;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

export interface CalculatorOperation {
  operation: 'add' | 'subtract' | 'multiply' | 'divide';
  a: number;
  b: number;
}

export interface CalculatorResult {
  result: number;
  operation: string;
}

export interface ServerConfig {
  port?: number;
  apiKey?: string;
  allowedOrigins?: string[];
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface AuthContext {
  isAuthenticated: boolean;
  apiKey?: string;
}

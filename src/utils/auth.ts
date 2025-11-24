/**
 * 認証ユーティリティ（リモートサーバー用）
 */

import type { AuthContext } from '../shared/types/index.js';

export function validateApiKey(providedKey: string | undefined, expectedKey: string): AuthContext {
  if (!expectedKey) {
    // APIキーが設定されていない場合は認証をスキップ
    return { isAuthenticated: true };
  }

  if (!providedKey) {
    return { isAuthenticated: false };
  }

  const isValid = providedKey === expectedKey;
  return {
    isAuthenticated: isValid,
    apiKey: isValid ? providedKey : undefined,
  };
}

export function extractBearerToken(authHeader: string | undefined): string | undefined {
  if (!authHeader) {
    return undefined;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return undefined;
}

export function generateApiKey(): string {
  // 簡易的なAPIキー生成（本番環境ではより安全な方法を使用）
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const length = 32;
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 簡易KVストレージツール
 * ローカル・リモート両方で使用する共通実装
 */

import { z } from 'zod';
import type { StorageItem } from '../types/index.js';

export class SimpleStorage {
  private store: Map<string, StorageItem> = new Map();

  set(key: string, value: string): StorageItem {
    const now = new Date().toISOString();
    const item: StorageItem = {
      key,
      value,
      createdAt: this.store.has(key) ? this.store.get(key)!.createdAt : now,
      updatedAt: now,
    };
    this.store.set(key, item);
    return item;
  }

  get(key: string): StorageItem | null {
    return this.store.get(key) || null;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  list(): StorageItem[] {
    return Array.from(this.store.values());
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export const SetSchema = z.object({
  key: z.string(),
  value: z.string(),
});

export const GetSchema = z.object({
  key: z.string(),
});

export const DeleteSchema = z.object({
  key: z.string(),
});

export const storageToolDefinitions = {
  set: {
    name: 'storage_set',
    description: 'Store a key-value pair in memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'The key to store',
        },
        value: {
          type: 'string',
          description: 'The value to store',
        },
      },
      required: ['key', 'value'],
    },
  },
  get: {
    name: 'storage_get',
    description: 'Retrieve a value by key from memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'The key to retrieve',
        },
      },
      required: ['key'],
    },
  },
  delete: {
    name: 'storage_delete',
    description: 'Delete a key-value pair from memory',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'The key to delete',
        },
      },
      required: ['key'],
    },
  },
  list: {
    name: 'storage_list',
    description: 'List all stored key-value pairs',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
};

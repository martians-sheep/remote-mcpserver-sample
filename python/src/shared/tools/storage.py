"""
簡易KVストレージツール
ローカル・リモート両方で使用する共通実装
"""

from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel


class StorageItem(BaseModel):
    """ストレージアイテム"""

    key: str
    value: str
    created_at: str
    updated_at: str


class SimpleStorage:
    """シンプルなメモリストレージ"""

    def __init__(self) -> None:
        self._store: Dict[str, StorageItem] = {}

    def set(self, key: str, value: str) -> StorageItem:
        """値を保存"""
        now = datetime.utcnow().isoformat()
        if key in self._store:
            created_at = self._store[key].created_at
        else:
            created_at = now

        item = StorageItem(key=key, value=value, created_at=created_at, updated_at=now)
        self._store[key] = item
        return item

    def get(self, key: str) -> Optional[StorageItem]:
        """値を取得"""
        return self._store.get(key)

    def delete(self, key: str) -> bool:
        """値を削除"""
        if key in self._store:
            del self._store[key]
            return True
        return False

    def list(self) -> List[StorageItem]:
        """全アイテムを一覧"""
        return list(self._store.values())

    def clear(self) -> None:
        """全アイテムを削除"""
        self._store.clear()

    def size(self) -> int:
        """アイテム数を取得"""
        return len(self._store)


# MCP Tool Definitions
storage_tools = {
    "set": {
        "name": "storage_set",
        "description": "Store a key-value pair in memory",
        "inputSchema": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "The key to store"},
                "value": {"type": "string", "description": "The value to store"},
            },
            "required": ["key", "value"],
        },
    },
    "get": {
        "name": "storage_get",
        "description": "Retrieve a value by key from memory",
        "inputSchema": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "The key to retrieve"}
            },
            "required": ["key"],
        },
    },
    "delete": {
        "name": "storage_delete",
        "description": "Delete a key-value pair from memory",
        "inputSchema": {
            "type": "object",
            "properties": {
                "key": {"type": "string", "description": "The key to delete"}
            },
            "required": ["key"],
        },
    },
    "list": {
        "name": "storage_list",
        "description": "List all stored key-value pairs",
        "inputSchema": {"type": "object", "properties": {}},
    },
}

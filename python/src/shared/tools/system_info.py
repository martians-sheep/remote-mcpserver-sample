"""
システム情報ツール
ローカル・リモート両方で使用する共通実装
"""

import platform
import sys
import psutil
from typing import Dict, Any


def get_system_info() -> Dict[str, Any]:
    """システム情報を取得"""
    memory = psutil.virtual_memory()
    process = psutil.Process()
    memory_info = process.memory_info()

    return {
        "platform": platform.system(),
        "platform_release": platform.release(),
        "platform_version": platform.version(),
        "architecture": platform.machine(),
        "processor": platform.processor(),
        "python_version": sys.version,
        "memory": {
            "total": memory.total,
            "available": memory.available,
            "percent": memory.percent,
            "used": memory.used,
        },
        "process_memory": {
            "rss": memory_info.rss,
            "vms": memory_info.vms,
        },
    }


# MCP Tool Definition
system_info_tool = {
    "name": "system_info",
    "description": "Get system information including platform, architecture, Python version, and memory usage",
    "inputSchema": {"type": "object", "properties": {}},
}

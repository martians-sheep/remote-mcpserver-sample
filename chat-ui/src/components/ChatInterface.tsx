'use client'

import { useState, useEffect, useRef } from 'react'

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  toolName?: string
  timestamp: Date
}

interface Tool {
  name: string
  description: string
  inputSchema: any
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedTool, setSelectedTool] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // サーバーに接続してツール一覧を取得
    connectToServer()
  }, [])

  const connectToServer = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/mcp/connect', { method: 'POST' })
      const data = await response.json()

      if (data.success) {
        setIsConnected(true)
        setTools(data.tools || [])
        addMessage({
          type: 'system',
          content: '✅ MCPサーバーに接続しました',
        })
      } else {
        addMessage({
          type: 'system',
          content: `❌ 接続エラー: ${data.error}`,
        })
      }
    } catch (error) {
      addMessage({
        type: 'system',
        content: `❌ 接続エラー: ${error}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addMessage = (msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...msg,
      id: Date.now().toString(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, newMessage])
  }

  const handleSend = async () => {
    if (!input.trim() || !selectedTool) return

    const userMessage = input
    setInput('')
    addMessage({ type: 'user', content: userMessage })

    setIsLoading(true)

    try {
      // JSONとしてパース
      const args = JSON.parse(userMessage)

      addMessage({
        type: 'tool',
        content: `実行中: ${selectedTool}`,
        toolName: selectedTool,
      })

      const response = await fetch('/api/mcp/call-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolName: selectedTool, arguments: args }),
      })

      const data = await response.json()

      if (data.success) {
        addMessage({
          type: 'assistant',
          content: JSON.stringify(data.result, null, 2),
        })
      } else {
        addMessage({
          type: 'system',
          content: `❌ エラー: ${data.error}`,
        })
      }
    } catch (error) {
      addMessage({
        type: 'system',
        content: `❌ エラー: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = (toolName: string, args: any) => {
    setSelectedTool(toolName)
    setInput(JSON.stringify(args, null, 2))
  }

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto p-4">
      {/* ヘッダー */}
      <div className="bg-gray-800 rounded-t-lg p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">🤖 MCP Chat UI</h1>
            <p className="text-gray-400 text-sm">Model Context Protocol Chat Interface</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm text-gray-300">
              {isConnected ? '接続中' : '未接続'}
            </span>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 bg-gray-800 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-4">👋 MCPサーバーと対話を開始してください</p>
            <p className="text-sm">ツールを選択してJSONパラメータを入力してください</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : message.type === 'assistant'
                  ? 'bg-gray-700 text-white'
                  : message.type === 'tool'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-600 text-gray-200'
              }`}
            >
              {message.toolName && (
                <div className="text-xs opacity-75 mb-1">🔧 {message.toolName}</div>
              )}
              <pre className="whitespace-pre-wrap font-mono text-sm">{message.content}</pre>
              <div className="text-xs opacity-50 mt-1">
                {message.timestamp.toLocaleTimeString('ja-JP')}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 rounded-lg p-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ツール選択とクイックアクション */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="mb-3">
          <label className="text-sm text-gray-400 block mb-2">ツール選択:</label>
          <select
            value={selectedTool}
            onChange={(e) => setSelectedTool(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:outline-none focus:border-blue-500"
            disabled={!isConnected}
          >
            <option value="">-- ツールを選択 --</option>
            {tools.map((tool) => (
              <option key={tool.name} value={tool.name}>
                {tool.name} - {tool.description}
              </option>
            ))}
          </select>
        </div>

        {/* クイックアクション */}
        <div className="mb-3 flex flex-wrap gap-2">
          <button
            onClick={() =>
              handleQuickAction('calculator', { operation: 'add', a: 10, b: 5 })
            }
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white"
            disabled={!isConnected}
          >
            🧮 計算例
          </button>
          <button
            onClick={() =>
              handleQuickAction('storage_set', { key: 'test', value: 'Hello!' })
            }
            className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white"
            disabled={!isConnected}
          >
            💾 保存例
          </button>
          <button
            onClick={() => handleQuickAction('system_info', {})}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white"
            disabled={!isConnected}
          >
            💻 システム情報
          </button>
          <button
            onClick={() => handleQuickAction('echo', { message: 'Hello, MCP!' })}
            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm text-white"
            disabled={!isConnected}
          >
            📢 エコー
          </button>
        </div>
      </div>

      {/* 入力エリア */}
      <div className="bg-gray-800 rounded-b-lg p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleSend()
              }
            }}
            placeholder="JSONパラメータを入力... (Ctrl+Enterで送信)"
            className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:outline-none focus:border-blue-500 resize-none"
            rows={3}
            disabled={!isConnected || isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!isConnected || isLoading || !input.trim() || !selectedTool}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
          >
            送信
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          💡 ヒント: JSONフォーマットでパラメータを入力してください
        </div>
      </div>
    </div>
  )
}

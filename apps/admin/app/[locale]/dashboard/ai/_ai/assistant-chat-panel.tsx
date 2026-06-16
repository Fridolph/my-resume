'use client'

/**
 * 简历助手对话面板 — 左侧聊天窗。
 */

import { Button } from '@heroui/react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useResumeAssistant } from './resume-assistant-context'
import type { AssistantMessage } from './use-resume-assistant-chat'

export function AssistantChatPanel() {
  const { messages, isStreaming, error, sendMessage, cancelStreaming } = useResumeAssistant()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!input.trim() || isStreaming) return
      sendMessage(input)
      setInput('')
    },
    [input, isStreaming, sendMessage],
  )

  return (
    <div className="flex h-full flex-col">
      {/* 消息列表 */}
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            👋 欢迎使用简历完整性助手。告诉我你想补充哪个版块吧！
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            ❌ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入区域 */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-zinc-200/70 p-3 dark:border-white/10"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          placeholder="描述你的经历，或者告诉 AI 你想补充什么..."
          rows={2}
          disabled={isStreaming}
          className="flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-primary-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:placeholder-zinc-500"
        />
        {isStreaming ? (
          <Button
            type="button"
            onPress={cancelStreaming}
            variant="danger"
            size="sm"
          >
            停止
          </Button>
        ) : (
          <Button type="submit" variant="primary" size="sm" isDisabled={!input.trim()}>
            发送
          </Button>
        )}
      </form>
    </div>
  )
}

/** 单条消息气泡 */
function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-primary-500 text-white'
            : 'border border-zinc-200/70 bg-white text-zinc-800 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200'
        }`}
      >
        <div className="whitespace-pre-wrap">{message.content}</div>

        {/* 结构化的 suggestion 提示 */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2 space-y-1 border-t border-zinc-200/30 pt-2 dark:border-white/10">
            {message.suggestions.map((s, i) => (
              <div key={i} className="rounded-lg bg-amber-50 px-3 py-2 text-xs dark:bg-amber-500/10">
                <span className="font-medium text-amber-700 dark:text-amber-400">
                  🧩 {s.explanation}
                </span>
                <span className="ml-2 text-zinc-500">{JSON.stringify(s.data).slice(0, 80)}...</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

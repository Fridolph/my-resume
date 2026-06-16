'use client'

/**
 * 简历助手对话面板 — 左侧聊天窗。
 *
 * 样式对齐公开站 AI Chat：用户气泡深色右对齐 + AI 气泡浅色左对齐。
 */

import { Button } from '@heroui/react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { useResumeAssistant } from './resume-assistant-context'
import type { AssistantMessage } from './use-resume-assistant-chat'

export function AssistantChatPanel() {
  const { messages, isStreaming, error, sendMessage, cancelStreaming } = useResumeAssistant()
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

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
    <div className="flex h-full flex-col bg-zinc-50/80 dark:bg-zinc-950/60">
      {/* 消息列表 */}
      <div className="flex-1 space-y-3 overflow-auto p-4">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="text-3xl">🧩</span>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              欢迎使用简历完整性助手
            </p>
            <p className="max-w-[240px] text-xs text-zinc-400 dark:text-zinc-500">
              告诉我你过往的经历，AI 会帮你提炼并补充到对应的简历版块中。
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {error && (
          <div className="rounded-xl border border-red-200/80 bg-red-50/80 p-3 text-sm text-red-700 dark:border-red-500/15 dark:bg-red-500/8 dark:text-red-400">
            ❌ {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 输入区域 */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-zinc-200/80 bg-white/80 p-3 dark:border-zinc-800 dark:bg-zinc-950/80"
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
          className="flex-1 resize-none rounded-xl border border-zinc-200/80 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-800 placeholder-zinc-400 outline-none transition focus:border-primary-400/80 focus:bg-white dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder-zinc-500 dark:focus:border-primary-500/60 dark:focus:bg-zinc-900"
        />
        {isStreaming ? (
          <Button type="button" onPress={cancelStreaming} variant="danger" size="sm">
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

// ----------------------------------------------------------------
// 消息气泡
// ----------------------------------------------------------------

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
      {/* 角色标签（仅 AI 显示） */}
      {!isUser && (
        <span className="mb-1 ml-3 text-[0.65rem] font-medium text-zinc-400 dark:text-zinc-500">
          AI 助手
        </span>
      )}

      <div
        className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6 ${
          isUser
            ? 'rounded-br-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950'
            : 'rounded-bl-lg border border-zinc-200/80 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content || (isUser ? '' : '...')}</p>

        {/* 结构化建议卡片 */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-2.5 space-y-1.5 border-t border-zinc-200/60 pt-2.5 dark:border-zinc-700">
            {message.suggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-2.5 dark:border-amber-500/15 dark:bg-amber-500/8"
              >
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  🧩 {s.explanation}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

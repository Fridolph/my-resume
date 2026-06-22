/**
 * 简历助手对话 Hook — SSE 流式消息管理。
 */

'use client'

import { useCallback, useRef, useState } from 'react'
import type { ResumeSectionCompleteness, ResumeAssistantSuggestion } from './resume-assistant.types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5577'

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  suggestions?: ResumeAssistantSuggestion[]
}

export function useResumeAssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [completeness, setCompleteness] = useState<ResumeSectionCompleteness[]>([])
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const assistantMsgRef = useRef<string>('')

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isStreaming) return

    setError(null)
    const userMsg: AssistantMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
    }
    setMessages((prev) => [...prev, userMsg])

    setIsStreaming(true)
    assistantMsgRef.current = ''
    const assistantId = crypto.randomUUID()

    const history = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const abortController = new AbortController()
    abortRef.current = abortController

    try {
      const response = await fetch(`${API_BASE}/api/ai/resume-assistant/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content.trim(), history }),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      // 添加空的 assistant 消息占位
      setMessages((prev) => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const eventLine = lines[lines.indexOf(line) - 1] ?? ''
          const event = eventLine.startsWith('event: ') ? eventLine.slice(7) : 'token'
          const dataStr = line.slice(6)

          try {
            const data = JSON.parse(dataStr)

            switch (event) {
              case 'token':
                assistantMsgRef.current += data.text ?? ''
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantMsgRef.current } : m,
                  ),
                )
                break
              case 'suggestion':
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, suggestions: [...(m.suggestions ?? []), data] }
                      : m,
                  ),
                )
                break
              case 'completeness':
                if (Array.isArray(data)) setCompleteness(data)
                break
              case 'error':
                setError(data.message ?? 'Unknown error')
                break
            }
          } catch {
            // skip unparseable events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return
      setError((err as Error).message ?? 'Network error')
      // 移除空的 assistant 占位
      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [messages, isStreaming])

  const cancelStreaming = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, isStreaming, completeness, error, sendMessage, cancelStreaming, clearMessages }
}

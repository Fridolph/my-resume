'use client'

/**
 * 简历助手共享状态 Context。
 *
 * 在 Shell 层使用 useResumeAssistantChat Hook，通过 Context 分发给
 * ChatPanel 和 PuzzlePanel 两个子组件。
 */

import { createContext, useContext, type ReactNode } from 'react'
import type { AssistantMessage, useResumeAssistantChat } from './use-resume-assistant-chat'
import type { ResumeSectionCompleteness } from './resume-assistant.types'

export interface ResumeAssistantState {
  messages: AssistantMessage[]
  isStreaming: boolean
  completeness: ResumeSectionCompleteness[]
  error: string | null
  sendMessage: (content: string) => Promise<void>
  cancelStreaming: () => void
}

const Context = createContext<ResumeAssistantState | null>(null)

export function ResumeAssistantProvider({
  value,
  children,
}: {
  value: ResumeAssistantState
  children: ReactNode
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useResumeAssistant(): ResumeAssistantState {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useResumeAssistant must be used within ResumeAssistantProvider')
  return ctx
}

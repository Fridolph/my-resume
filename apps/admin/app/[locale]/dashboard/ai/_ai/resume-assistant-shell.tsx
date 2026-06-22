'use client'

import { Card, CardContent } from '@heroui/react'
import { useCallback, useState } from 'react'
import { AssistantChatPanel } from './assistant-chat-panel'
import { ResumeAssistantProvider, useResumeAssistant } from './resume-assistant-context'
import { ResumePuzzlePanel } from './resume-puzzle-panel'
import { useResumeAssistantChat } from './use-resume-assistant-chat'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:5577'

export function ResumeAssistantShell() {
  const chat = useResumeAssistantChat()

  return (
    <ResumeAssistantProvider value={chat}>
      <ShellContent />
    </ResumeAssistantProvider>
  )
}

function ShellContent() {
  const { completeness } = useResumeAssistant()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'ok' | 'error'>('idle')
  const [syncMessage, setSyncMessage] = useState('')

  const allComplete = completeness.length > 0 && completeness.every((c) => c.status === 'complete')
  const incompleteLabels = completeness
    .filter((c) => c.status !== 'complete')
    .map((c) => c.label)

  const handleSync = useCallback(async () => {
    if (!allComplete || syncStatus === 'syncing') return
    setSyncStatus('syncing')
    setSyncMessage('')

    try {
      const res = await fetch(`${API_BASE}/api/ai/resume-assistant/sync`, { method: 'POST' })
      const data = await res.json() as { ok: boolean; message: string }
      setSyncStatus(data.ok ? 'ok' : 'error')
      setSyncMessage(data.message)
    } catch {
      setSyncStatus('error')
      setSyncMessage('网络错误，请稍后重试')
    }
  }, [allComplete, syncStatus])

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden p-4">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            简历完整性助手
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            通过和 AI 对话，逐步完善简历的各个版块。右边的拼图会随着完整度逐渐点亮。
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden md:grid md:grid-cols-[1fr_22rem]">
        {/* 左侧 */}
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            <AssistantChatPanel />
          </CardContent>
        </Card>

        {/* 右侧 */}
        <Card className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardContent className="flex flex-1 flex-col gap-3 overflow-auto p-4">
            <ResumePuzzlePanel />

            {/* 同步按钮 */}
            <div className="border-t border-zinc-200/70 pt-3 dark:border-white/10">
              {!allComplete && completeness.length > 0 && (
                <p className="mb-2 text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ 以下版块尚未完成：{incompleteLabels.join('、')}
                </p>
              )}
              <button
                onClick={handleSync}
                disabled={!allComplete || syncStatus === 'syncing'}
                className={`w-full rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  allComplete
                    ? 'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700'
                    : 'cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-white/5 dark:text-zinc-600'
                }`}
              >
                {syncStatus === 'syncing'
                  ? '同步中...'
                  : '同步到简历草稿'}
              </button>
              {syncMessage && (
                <p className={`mt-1 text-xs ${syncStatus === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {syncStatus === 'ok' ? '✅' : '❌'} {syncMessage}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

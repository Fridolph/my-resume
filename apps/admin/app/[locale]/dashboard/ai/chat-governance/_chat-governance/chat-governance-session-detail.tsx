'use client'

import { useRequest } from 'alova/client'
import { createFetchAiChatSessionDetailMethod } from '@my-resume/api-client'
import { Chip } from '@heroui/react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AiChatSession } from '@my-resume/api-client'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extractSourceKey(lead: { sourceKey?: string } | undefined): string {
  const raw = (lead as any)?.sourceKey ?? ''
  if (typeof raw !== 'string' || !raw) return '—'
  const parts = raw.split(':')
  return parts[2] ? `${parts[2].slice(0, 10)}...` : raw
}

export function ChatGovernanceSessionDetail({
  sessionId,
}: {
  sessionId: string
}) {
  const { accessToken, status } = useAdminSession()

  const sessionDetailRequest = useRequest(
    () =>
      createFetchAiChatSessionDetailMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        sessionId,
      }),
    { immediate: status === 'ready' && Boolean(accessToken), force: true },
  )

  const sessionDetail = (sessionDetailRequest.data ?? null) as AiChatSession | null

  if (sessionDetailRequest.loading) {
    return <p className="py-8 text-center text-sm text-zinc-500">加载中...</p>
  }

  if (sessionDetailRequest.error) {
    return <p className="py-8 text-center text-sm text-rose-600">会话详情加载失败，请稍后重试</p>
  }

  if (!sessionDetail) {
    return <p className="py-8 text-center text-sm text-zinc-500">无会话数据</p>
  }

  return (
    <div className="grid min-h-0 gap-4">
      <div className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="grid gap-0.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">访客标识</span>
            <strong className="text-zinc-950 dark:text-white">{sessionDetail.lead.displayName ?? '未知访客'}</strong>
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">访客 IP</span>
            <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{extractSourceKey(sessionDetail.lead as any)}</span>
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">会话状态</span>
            <Chip color={sessionDetail.status === 'open' ? 'success' : 'default'} size="sm" variant="soft">
              {sessionDetail.status === 'open' ? '进行中' : sessionDetail.status}
            </Chip>
          </div>
          <div className="grid gap-0.5">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">对话轮次</span>
            <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.turnCount} / 20</span>
          </div>
        </div>
        {sessionDetail.lead.companyName ? (
          <div className="grid gap-0.5 border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">公司</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.lead.companyName}</span>
          </div>
        ) : null}
        {sessionDetail.lead.contact ? (
          <div className="grid gap-0.5 border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">联系信息</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.lead.contact}</span>
          </div>
        ) : null}
        {sessionDetail.lead.message ? (
          <div className="grid gap-0.5 border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">访客留言</span>
            <span className="text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.lead.message}</span>
          </div>
        ) : null}
        {sessionDetail.interimSummary ? (
          <details className="mt-1 rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-2.5 dark:border-emerald-500/15 dark:bg-emerald-500/8">
            <summary className="cursor-pointer text-xs font-medium text-emerald-700 dark:text-emerald-300">第 10 轮摘要</summary>
            <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-200">{sessionDetail.interimSummary.summary}</p>
          </details>
        ) : null}
        {sessionDetail.finalSummary ? (
          <details className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-2.5 dark:border-emerald-500/15 dark:bg-emerald-500/8">
            <summary className="cursor-pointer text-xs font-medium text-emerald-700 dark:text-emerald-300">第 20 轮摘要</summary>
            <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-200">{sessionDetail.finalSummary.summary}</p>
          </details>
        ) : null}
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          创建：{formatDateTime(sessionDetail.createdAt)} · 更新：{formatDateTime(sessionDetail.updatedAt)}
        </span>
      </div>

      <div className="grid gap-0.5">
        <span className="px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          聊天记录（{sessionDetail.messages.length} 条消息）
        </span>
        <div className="grid min-h-0 gap-2 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
          {sessionDetail.messages.length === 0 ? (
            <div className="grid place-items-center py-10 text-sm text-zinc-400 dark:text-zinc-500">
              暂无聊天消息
            </div>
          ) : (
            sessionDetail.messages.map((message, index) => {
              const isUser = message.role === 'user'
              const prevMessage = index > 0 ? sessionDetail.messages[index - 1] : null
              const showRoleLabel = !prevMessage || prevMessage.role !== message.role

              return (
                <div
                  className={`grid gap-1 ${isUser ? 'justify-items-end' : 'justify-items-start'}`}
                  key={message.id}>
                  {showRoleLabel ? (
                    <span className={`px-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${isUser ? 'text-right text-amber-600/80 dark:text-amber-400/80' : 'text-sky-600/80 dark:text-sky-400/80'}`}>
                      {isUser ? '访客' : 'AI 助手'} · 第 {message.turnIndex} 轮
                    </span>
                  ) : null}
                  <div
                    className={[
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                      isUser
                        ? 'rounded-br-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                        : 'rounded-bl-lg border border-zinc-200/80 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
                    ].join(' ')}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.answerBlocks && message.answerBlocks.length > 0 && !isUser ? (
                      <div className="mt-2 grid gap-2 border-t border-zinc-200/60 pt-2 dark:border-zinc-700">
                        {message.answerBlocks.map((block, blockIndex) => {
                          if (block.type === 'project_card' || block.type === 'experience_card') {
                            return (
                              <div className="rounded-xl border border-blue-200/60 bg-blue-50/60 p-2.5 dark:border-blue-500/15 dark:bg-blue-500/8" key={`${block.type}-${blockIndex}`}>
                                <strong className="block text-xs text-zinc-800 dark:text-zinc-200">{block.title}</strong>
                                <span className="text-[0.68rem] text-zinc-500 dark:text-zinc-400">{block.subtitle} · {block.period}</span>
                                <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{block.summary}</p>
                              </div>
                            )
                          }
                          if (block.type === 'summary') {
                            return (
                              <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-2.5 dark:border-emerald-500/15 dark:bg-emerald-500/8" key={`${block.type}-${blockIndex}`}>
                                <strong className="block text-xs text-zinc-800 dark:text-zinc-200">{block.title}</strong>
                                <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{block.summary}</p>
                              </div>
                            )
                          }
                          return null
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

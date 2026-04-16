'use client'

import { Button } from '@heroui/react/button'
import type { ReactNode } from 'react'
import { useState } from 'react'

import type { ResumeDraftSummarySnapshot } from '../../../resume/_resume/types/resume.types'
import type { AiWorkbenchRuntimeSummary } from '../types/ai-workbench.types'

interface CompactWorkbenchInfoCardsProps {
  canEditResume: boolean
  draftSnapshot?: ResumeDraftSummarySnapshot | null
  draftSnapshotError?: Error | null
  draftSnapshotLoading: boolean
  draftSnapshotMessage?: string | null
  onReloadDraftSnapshot: () => void
  onReloadRuntimeSummary: () => void
  runtimeError?: Error | null
  runtimeLoading: boolean
  runtimeSummary?: AiWorkbenchRuntimeSummary | null
}

function CollapseCard({
  children,
  collapsedSummary,
  defaultExpanded = false,
  description,
  title,
}: {
  children: ReactNode
  collapsedSummary: string
  defaultExpanded?: boolean
  description: string
  title: string
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)

  return (
    <article className="grid gap-3 rounded-[1.35rem] border border-zinc-200/80 bg-zinc-50/82 p-4 dark:border-zinc-800 dark:bg-zinc-900/65">
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-semibold text-zinc-950 dark:text-white">{title}</p>
          <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{description}</p>
        </div>
        <Button
          onPress={() => setExpanded((currentValue) => !currentValue)}
          size="sm"
          type="button"
          variant="ghost">
          {expanded ? '收起' : '展开'}
        </Button>
      </div>

      {!expanded ? (
        <div className="rounded-[1rem] border border-zinc-200/70 bg-white/86 px-3 py-2 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300">
          {collapsedSummary}
        </div>
      ) : (
        children
      )}
    </article>
  )
}

export function CompactWorkbenchInfoCards({
  canEditResume,
  draftSnapshot,
  draftSnapshotError,
  draftSnapshotLoading,
  draftSnapshotMessage,
  onReloadDraftSnapshot,
  onReloadRuntimeSummary,
  runtimeError,
  runtimeLoading,
  runtimeSummary,
}: CompactWorkbenchInfoCardsProps) {
  return (
    <section className="grid gap-3 lg:grid-cols-2" data-testid="compact-workbench-info-cards">
      {canEditResume ? (
        <CollapseCard
          collapsedSummary={
            draftSnapshot
              ? `${draftSnapshot.resume.profile.headline} · ${new Date(
                  draftSnapshot.updatedAt,
                ).toLocaleString('zh-CN', {
                  hour12: false,
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}`
              : '当前草稿快照会在这里显示'
          }
          description="AI 建议写回成功后，这里会立刻刷新，帮助确认草稿是否已接收最新结构化改写。"
          title="草稿反馈">
          <div className="grid gap-3">
            {draftSnapshotLoading ? (
              <span className="text-sm text-zinc-500 dark:text-zinc-400">正在读取当前草稿快照...</span>
            ) : null}
            {draftSnapshotError ? (
              <div className="grid gap-3">
                <span className="text-sm text-red-600 dark:text-red-300">
                  {draftSnapshotError.message}
                </span>
                <Button onPress={onReloadDraftSnapshot} size="sm" type="button" variant="outline">
                  重试草稿快照读取
                </Button>
              </div>
            ) : null}
            {draftSnapshotMessage ? (
              <div className="rounded-[1rem] border border-blue-200/80 bg-blue-50/82 px-3 py-2 text-sm text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                {draftSnapshotMessage}
              </div>
            ) : null}
            {draftSnapshot ? (
              <div className="grid gap-2 rounded-[1rem] border border-zinc-200/80 bg-white/90 p-3 text-sm leading-6 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950/70 dark:text-zinc-300">
                <strong className="text-zinc-950 dark:text-white">
                  {draftSnapshot.resume.profile.headline}
                </strong>
                <span>{draftSnapshot.resume.profile.summary}</span>
                <span>
                  最近更新时间：
                  {new Date(draftSnapshot.updatedAt).toLocaleString('zh-CN', {
                    hour12: false,
                  })}
                </span>
              </div>
            ) : null}
          </div>
        </CollapseCard>
      ) : null}

      <CollapseCard
        collapsedSummary={
          runtimeSummary
            ? `${runtimeSummary.provider} / ${runtimeSummary.model} · ${runtimeSummary.mode}`
            : '当前 Provider / model / mode 会在这里显示'
        }
        description="把 Provider 边界收成小卡片，保留上下文，但不再占用工作台主操作区。"
        title="运行时摘要">
        <div className="grid gap-3">
          {runtimeLoading ? (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">正在读取运行时摘要...</span>
          ) : null}
          {runtimeError ? (
            <div className="grid gap-3">
              <span className="text-sm text-red-600 dark:text-red-300">{runtimeError.message}</span>
              <Button onPress={onReloadRuntimeSummary} size="sm" type="button" variant="outline">
                重试运行时读取
              </Button>
            </div>
          ) : null}
          <div className="grid gap-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
            <div className="rounded-[1rem] border border-zinc-200/80 bg-white/90 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/70">
              当前草稿是唯一优化基线；JD、目标岗位和优化要求只负责告诉 AI 应该朝什么方向改。
            </div>
            <div className="rounded-[1rem] border border-zinc-200/80 bg-white/90 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/70">
              输出同时保留可阅读结论与结构化 diff，既方便理解原因，也方便按模块应用。
            </div>
            <div className="rounded-[1rem] border border-zinc-200/80 bg-white/90 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950/70">
              公开站仍需手动发布，后台不会自动覆盖或自动上线。
            </div>
          </div>
        </div>
      </CollapseCard>
    </section>
  )
}

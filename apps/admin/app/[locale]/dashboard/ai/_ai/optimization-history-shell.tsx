'use client'

import { Button, Chip } from '@heroui/react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { OptimizationHistoryRecordDrawer } from './components/optimization-history-record-drawer'
import { ResumeOptimizationHistoryPanel } from './components/resume-optimization-history-panel'
import {
  readResumeOptimizationHistory,
  readWorkbenchRelationIndex,
  type ResumeOptimizationHistoryEntry,
} from './utils/resume-optimization-persistence'

export function AdminAiOptimizationHistoryShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const [optimizationHistory, setOptimizationHistory] = useState<
    ResumeOptimizationHistoryEntry[]
  >([])
  const [selectedEntry, setSelectedEntry] = useState<ResumeOptimizationHistoryEntry | null>(
    null,
  )
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    setOptimizationHistory(readResumeOptimizationHistory())
  }, [])

  const isAdmin = Boolean(currentUser?.capabilities.canTriggerAiAnalysis)
  const archiveStats = useMemo(() => {
    const moduleCount = new Set(
      optimizationHistory.flatMap((entry) => entry.changedModules),
    ).size
    const latestEntry = optimizationHistory[0] ?? null
    const latestLabel = latestEntry
      ? new Date(latestEntry.createdAt).toLocaleString('zh-CN', {
          hour12: false,
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '暂无'

    return [
      {
        label: '本地记录',
        value: `${optimizationHistory.length}`,
        description: '保留最近生成的结构化优化结果',
      },
      {
        label: '影响模块',
        value: `${moduleCount}`,
        description: '按 profile / projects 等模块聚合',
      },
      {
        label: '最近生成',
        value: latestLabel,
        description: latestEntry?.summary ?? '首次分析后会在这里出现',
      },
    ]
  }, [optimizationHistory])
  const relationIndex = useMemo(() => readWorkbenchRelationIndex(), [optimizationHistory])
  const relationStates = useMemo(
    () =>
      Object.fromEntries(
        optimizationHistory.map((entry) => {
          const relationEntry = relationIndex[entry.instructionHash]
          const linkedScenarios = (
            ['jd-match', 'offer-compare', 'resume-review'] as const
          ).filter((scenario) => Boolean(relationEntry?.analysisUsageRecordIds[scenario]))
          const linkedScenarioSet = new Set(linkedScenarios)

          let completionLabel = '仅优化建议'

          if (
            linkedScenarioSet.has('jd-match') &&
            linkedScenarioSet.has('offer-compare') &&
            linkedScenarioSet.has('resume-review')
          ) {
            completionLabel = '关联完整'
          } else if (linkedScenarioSet.has('offer-compare')) {
            completionLabel = '已含 Offer 对比'
          } else if (linkedScenarioSet.has('jd-match')) {
            completionLabel = '已含 JD 匹配'
          }

          return [
            entry.resultId,
            {
              completionLabel,
              linkedScenarios,
            },
          ]
        }),
      ),
    [optimizationHistory, relationIndex],
  )
  const selectedLinkedUsageRecordIds = useMemo(
    () =>
      selectedEntry
        ? relationIndex[selectedEntry.instructionHash]?.analysisUsageRecordIds ?? {}
        : {},
    [relationIndex, selectedEntry],
  )

  if (status !== 'ready' || !currentUser) {
    return null
  }

  return (
    <div className="stack" data-testid="ai-optimization-archive-page">
      <section className="relative overflow-hidden rounded-[2.25rem] border border-zinc-200/80 bg-[radial-gradient(circle_at_16%_10%,rgba(37,99,235,0.16),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,248,255,0.92))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_18%_14%,rgba(59,130,246,0.2),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] dark:shadow-none">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-8 top-8 h-32 w-32 rounded-full border border-blue-200/50 bg-white/30 blur-2xl dark:border-blue-400/10 dark:bg-blue-400/10"
        />
        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(280px,0.48fr)]">
          <div className="grid gap-5">
            <div className="flex flex-wrap items-center gap-2">
              <Chip size="sm">当前账号：{currentUser.username}</Chip>
              <Chip size="sm">当前角色：{currentUser.role}</Chip>
              <Chip size="sm">{isAdmin ? '真实分析可用' : '缓存只读体验'}</Chip>
            </div>
            <div className="grid gap-3">
              <p className="eyebrow">AI Archive</p>
              <h1 className="text-[clamp(2rem,5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-zinc-950 dark:text-white">
                优化记录
              </h1>
              <p className="max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
                工作台继续专注“输入与分析”，这里负责“回看、复用与教学记录”。
                最近优化记录会作为统一入口，在同一条记录下回看简历优化建议与关联分析明细。
              </p>
            </div>

            <div className="dashboard-entry-actions">
              <Link
                className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 bg-white/70 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:bg-white hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
                href="/dashboard/ai">
                返回 AI 工作台
              </Link>
              <Button
                onPress={() => {
                  setOptimizationHistory(readResumeOptimizationHistory())
                }}
                size="sm"
                type="button"
                variant="outline">
                刷新记录
              </Button>
            </div>
          </div>

          <div className="grid gap-3 rounded-[1.75rem] border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/48">
            <p className="eyebrow">记录中心总览</p>
            <div className="grid gap-3">
              {archiveStats.map((item) => (
                <div
                  className="rounded-[1.25rem] border border-zinc-200/70 bg-zinc-50/82 p-4 dark:border-zinc-800 dark:bg-zinc-900/70"
                  key={item.label}>
                  <span className="text-xs font-semibold tracking-[0.08em] text-zinc-400 uppercase">
                    {item.label}
                  </span>
                  <strong className="mt-2 block text-xl font-semibold text-zinc-950 dark:text-white">
                    {item.value}
                  </strong>
                  <span className="mt-1 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      <ResumeOptimizationHistoryPanel
        entries={optimizationHistory}
        onOpenDetail={(entry) => {
          setSelectedEntry(entry)
          setIsDrawerOpen(true)
        }}
        relationStates={relationStates}
      />

      {accessToken && selectedEntry ? (
        <OptimizationHistoryRecordDrawer
          accessToken={accessToken}
          apiBaseUrl={DEFAULT_API_BASE_URL}
          entry={selectedEntry}
          isOpen={isDrawerOpen}
          linkedUsageRecordIds={selectedLinkedUsageRecordIds}
          onClose={() => {
            setIsDrawerOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

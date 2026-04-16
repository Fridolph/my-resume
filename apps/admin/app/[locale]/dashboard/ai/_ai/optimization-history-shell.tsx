'use client'

import { Button, Card, CardContent, Chip } from '@heroui/react'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
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
      <section className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 bg-[radial-gradient(circle_at_16%_10%,rgba(37,99,235,0.13),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.98),rgba(244,248,255,0.9))] p-4 shadow-[0_18px_52px_rgba(15,23,42,0.07)] dark:border-zinc-800 dark:bg-[radial-gradient(circle_at_18%_14%,rgba(59,130,246,0.16),transparent_30%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] dark:shadow-none sm:p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-6 top-6 h-24 w-24 rounded-full border border-blue-200/40 bg-white/20 blur-2xl dark:border-blue-400/10 dark:bg-blue-400/10"
        />
        <div className="relative grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">当前角色：{currentUser.role}</Chip>
            <Chip size="sm">{isAdmin ? '真实分析可用' : '缓存只读体验'}</Chip>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="grid gap-2">
              <p className="eyebrow">AI Archive</p>
              <h1 className="text-[clamp(2rem,4vw,3.25rem)] font-semibold leading-none tracking-[-0.055em] text-zinc-950 dark:text-white">
                优化记录
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                工作台继续专注“输入与分析”，这里负责“回看、复用与教学记录”。
                最近优化记录会作为统一入口，在同一条记录下回看简历优化建议与关联分析明细。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3" data-testid="optimization-history-actions">
              <Button
                className="h-10 rounded-full px-4 text-sm font-medium"
                onPress={() => router.push('/dashboard/ai')}
                size="md"
                type="button"
                variant="outline">
                返回 AI 工作台
              </Button>
              <Button
                className="h-10 rounded-full px-4 text-sm font-medium"
                onPress={() => {
                  setOptimizationHistory(readResumeOptimizationHistory())
                }}
                size="md"
                type="button"
                variant="outline">
                刷新记录
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <p className="eyebrow">记录中心总览</p>
            <div
              className="grid gap-3 sm:grid-cols-2 md:grid-cols-3"
              data-testid="optimization-history-overview-grid">
              {archiveStats.map((item) => (
                <Card
                  className="border border-zinc-200/70 bg-white/74 shadow-sm backdrop-blur dark:border-white/10 dark:bg-zinc-950/48"
                  data-testid="optimization-history-overview-card"
                  key={item.label}>
                  <CardContent className="grid gap-1.5 p-3">
                    <span className="text-[0.68rem] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
                      {item.label}
                    </span>
                    <strong className="truncate text-lg font-semibold text-zinc-950 dark:text-white">
                      {item.value}
                    </strong>
                    <span className="line-clamp-2 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                      {item.description}
                    </span>
                  </CardContent>
                </Card>
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

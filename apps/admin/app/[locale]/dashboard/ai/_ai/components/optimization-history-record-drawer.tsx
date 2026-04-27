'use client'

import { useRequest } from 'alova/client'
import { Drawer, Skeleton } from '@heroui/react'
import { DisplayPill, DisplaySectionCard, DisplaySurfaceCard } from '@my-resume/ui/display'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import { AdminDrawerShell } from '../../../../../_shared/ui/components/heroui'
import {
  createFetchAiResumeOptimizationResultMethod,
  createFetchAiUsageRecordDetailMethod,
} from '../services/ai-workbench-api'
import type {
  AiResumeOptimizationResult,
  AiUsageRecordDetail,
  AiWorkbenchLocale,
  AiWorkbenchReport,
  AiWorkbenchScenario,
} from '../types/ai-workbench.types'
import {
  extractOptimizationInstructionTitle,
  type ResumeOptimizationHistoryEntry,
} from '../utils/resume-optimization-persistence'
import {
  formatLocale,
  formatOptimizationModule,
} from '../utils/analysis-utils'
import { AnalysisReportDetails } from './analysis-report-details'
import { AnalysisReportOverview } from './analysis-report-overview'

interface OptimizationHistoryRecordDrawerProps {
  accessToken: string
  apiBaseUrl: string
  entry: ResumeOptimizationHistoryEntry | null
  isOpen: boolean
  linkedUsageRecordIds: Partial<Record<AiWorkbenchScenario, string>>
  onClose: () => void
}

type DrawerTabKey = 'optimization' | AiWorkbenchScenario

const tabMeta: Array<{
  description: string
  key: DrawerTabKey
  label: string
}> = [
  {
    key: 'optimization',
    label: '简历优化建议',
    description: '展示当前优化结果的概览摘要、关注点和影响模块。',
  },
  {
    key: 'jd-match',
    label: 'JD 匹配分析',
    description: '复用辅助分析报告结构，查看结论层、依据层和风险层。',
  },
  {
    key: 'offer-compare',
    label: 'Offer 对比建议',
    description: '查看当前记录下关联的 offer 对比分析结果。',
  },
  {
    key: 'resume-review',
    label: '简历评审分析',
    description: '查看当前记录下关联的简历评审分析结果。',
  },
]

function isWorkbenchReport(detail: unknown): detail is AiWorkbenchReport {
  if (!detail || typeof detail !== 'object') {
    return false
  }

  const candidate = detail as Record<string, unknown>
  return typeof candidate.reportId === 'string' && typeof candidate.summary === 'string'
}

function countLinkedScenarios(linkedUsageRecordIds: Partial<Record<AiWorkbenchScenario, string>>) {
  return (['jd-match', 'offer-compare', 'resume-review'] as const).filter(
    (scenario) => Boolean(linkedUsageRecordIds[scenario]),
  ).length
}

export function OptimizationHistoryRecordDrawer({
  accessToken,
  apiBaseUrl,
  entry,
  isOpen,
  linkedUsageRecordIds,
  onClose,
}: OptimizationHistoryRecordDrawerProps) {
  const [selectedTab, setSelectedTab] = useState<DrawerTabKey>('optimization')
  const [optimizationDetail, setOptimizationDetail] =
    useState<AiResumeOptimizationResult | null>(null)
  const [optimizationErrorMessage, setOptimizationErrorMessage] = useState<string | null>(null)
  const [analysisDetails, setAnalysisDetails] = useState<
    Partial<Record<AiWorkbenchScenario, AiUsageRecordDetail>>
  >({})
  const [analysisErrorMessages, setAnalysisErrorMessages] = useState<
    Partial<Record<AiWorkbenchScenario, string>>
  >({})
  const {
    loading: optimizationLoading,
    send: fetchOptimizationDetail,
  } = useRequest(
    (payload: { locale: AiWorkbenchLocale; resultId: string }) =>
      createFetchAiResumeOptimizationResultMethod({
        apiBaseUrl,
        accessToken,
        resultId: payload.resultId,
        locale: payload.locale,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const {
    loading: analysisDetailLoading,
    send: fetchUsageRecordDetail,
  } = useRequest(
    (recordId: string) =>
      createFetchAiUsageRecordDetailMethod({
        apiBaseUrl,
        accessToken,
        recordId,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const fetchOptimizationDetailRef = useRef(fetchOptimizationDetail)
  const fetchUsageRecordDetailRef = useRef(fetchUsageRecordDetail)

  useEffect(() => {
    fetchOptimizationDetailRef.current = fetchOptimizationDetail
  }, [fetchOptimizationDetail])

  useEffect(() => {
    fetchUsageRecordDetailRef.current = fetchUsageRecordDetail
  }, [fetchUsageRecordDetail])

  useEffect(() => {
    if (!isOpen || !entry) {
      return
    }

    setSelectedTab('optimization')
    setOptimizationErrorMessage(null)
    setAnalysisErrorMessages({})
    setAnalysisDetails({})

    void fetchOptimizationDetailRef.current({
      locale: entry.locale,
      resultId: entry.resultId,
    })
      .then((detail) => {
        setOptimizationDetail(detail)
      })
      .catch((error) => {
        setOptimizationDetail(null)
        setOptimizationErrorMessage(
          error instanceof Error ? error.message : '优化结果详情加载失败，请稍后重试。',
        )
      })

    for (const scenario of ['jd-match', 'offer-compare', 'resume-review'] as const) {
      const usageRecordId = linkedUsageRecordIds[scenario]

      if (!usageRecordId) {
        continue
      }

      void fetchUsageRecordDetailRef.current(usageRecordId)
        .then((detail) => {
          setAnalysisDetails((currentValue) => ({
            ...currentValue,
            [scenario]: detail,
          }))
        })
        .catch((error) => {
          setAnalysisErrorMessages((currentValue) => ({
            ...currentValue,
            [scenario]:
              error instanceof Error
                ? error.message
                : '分析记录详情加载失败，请稍后重试。',
          }))
        })
    }
  }, [
    entry,
    isOpen,
    linkedUsageRecordIds,
  ])

  const linkedCount = useMemo(
    () => countLinkedScenarios(linkedUsageRecordIds),
    [linkedUsageRecordIds],
  )

  const runtimeSummary = useMemo(
    () => ({
      mode:
        optimizationDetail?.providerSummary.mode ??
        analysisDetails['resume-review']?.mode ??
        'unknown',
      model:
        optimizationDetail?.providerSummary.model ??
        analysisDetails['resume-review']?.model ??
        'unknown',
      provider:
        optimizationDetail?.providerSummary.provider ??
        analysisDetails['resume-review']?.provider ??
        'unknown',
      supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'] as const,
    }),
    [analysisDetails, optimizationDetail],
  )

  function renderOptimizationPanel() {
    if (optimizationLoading && !optimizationDetail) {
      return (
        <div className="grid gap-2.5">
          <Skeleton className="h-20 rounded-[1.1rem] bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-28 rounded-[1.1rem] bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      )
    }

    if (optimizationErrorMessage) {
      return (
        <DisplaySurfaceCard
          as="section"
          className="grid gap-2.5 border-amber-200/80 bg-amber-50/82 p-3 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
          <div className="grid gap-2">
            <p className="eyebrow text-amber-700 dark:text-amber-200">结果缓存已失效</p>
            <h3 className="text-lg font-semibold">该条优化结果已失效或不可读取</h3>
            <p className="text-sm leading-6 text-amber-800/82 dark:text-amber-100/82">
              本地记录仍可回看；若需重新查看完整优化建议，请返回 AI 工作台重新生成。
            </p>
          </div>
          {entry ? (
            <div className="grid gap-2 rounded-[1rem] border border-amber-200/70 bg-white/58 p-2.5 dark:border-amber-400/20 dark:bg-zinc-950/30">
              <strong className="text-sm text-zinc-950 dark:text-white">
                {extractOptimizationInstructionTitle(entry.instruction)}
              </strong>
              <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {entry.summary}
              </span>
              <div className="flex flex-wrap gap-2">
                {entry.changedModules.map((module) => (
                  <DisplayPill
                    className="min-h-8 border-amber-200/80 bg-amber-100/70 px-3 py-1 text-xs text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100"
                    key={`${entry.resultId}-fallback-${module}`}>
                    {formatOptimizationModule(module)}
                  </DisplayPill>
                ))}
              </div>
            </div>
          ) : null}
          <span className="text-xs text-amber-700/80 dark:text-amber-100/72">
            接口返回：{optimizationErrorMessage}
          </span>
        </DisplaySurfaceCard>
      )
    }

    if (!optimizationDetail) {
      return (
        <div className="rounded-[1.25rem] border border-dashed border-zinc-200/80 bg-zinc-50/80 p-4 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          当前还没有可读取的简历优化摘要。
        </div>
      )
    }

    return (
      <div className="grid gap-2.5">
        <DisplaySectionCard
          className="grid gap-2.5 p-3.5 md:p-4"
          compact
          description="这里保留的是轻量展示摘要，不复制真正的 apply patch；结果页仍是完整阅读与应用入口。"
          eyebrow="优化建议"
          title="当前优化摘要"
          titleAs="h3">
          <div className="grid gap-2">
            <strong className="text-lg text-zinc-950 dark:text-white">
              {optimizationDetail.summary}
            </strong>
            <div className="flex flex-wrap gap-2">
              {optimizationDetail.focusAreas.map((item) => (
                <DisplayPill
                  className="min-h-8 border-blue-200/70 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200"
                  key={`${optimizationDetail.resultId}-${item}`}>
                  {item}
                </DisplayPill>
              ))}
            </div>
          </div>
        </DisplaySectionCard>

        <DisplaySurfaceCard as="section" className="grid gap-2.5 p-3.5 md:p-4">
          <div className="grid gap-2">
            <h3 className="text-base font-semibold text-zinc-950 dark:text-white">
              影响模块
            </h3>
            <div className="flex flex-wrap gap-2">
              {optimizationDetail.changedModules.map((module) => (
                <DisplayPill
                  className="min-h-8 border-zinc-200/80 bg-white px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  key={`${optimizationDetail.resultId}-${module}`}>
                  {formatOptimizationModule(module)}
                </DisplayPill>
              ))}
            </div>
          </div>
          <div className="dashboard-entry-actions">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href={`/dashboard/ai/resume-optimization/results/${optimizationDetail.resultId}`}>
              打开结果页
            </Link>
          </div>
        </DisplaySurfaceCard>
      </div>
    )
  }

  function renderAnalysisPanel(scenario: AiWorkbenchScenario) {
    const usageRecordId = linkedUsageRecordIds[scenario]

    if (!usageRecordId) {
      return (
        <div className="rounded-[1.25rem] border border-dashed border-zinc-200/80 bg-zinc-50/80 p-4 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          该条优化记录下暂无此分析场景记录。
        </div>
      )
    }

    if (analysisDetailLoading && !analysisDetails[scenario] && !analysisErrorMessages[scenario]) {
      return (
        <div className="grid gap-2.5">
          <Skeleton className="h-20 rounded-[1.1rem] bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-32 rounded-[1.1rem] bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      )
    }

    if (analysisErrorMessages[scenario]) {
      return (
        <div className="rounded-[1.25rem] border border-amber-200/80 bg-amber-50/82 p-4 text-sm leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
          分析记录详情加载失败：{analysisErrorMessages[scenario]}
        </div>
      )
    }

    const detail = analysisDetails[scenario]
    const report = isWorkbenchReport(detail?.detail) ? detail.detail : null

    if (!detail || !report) {
      return (
        <div className="rounded-[1.25rem] border border-dashed border-zinc-200/80 bg-zinc-50/80 p-4 text-sm leading-6 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          当前记录没有可阅读的结构化分析详情。
        </div>
      )
    }

    return (
      <div className="grid gap-3">
        <AnalysisReportOverview report={report} runtimeSummary={runtimeSummary} />
        <AnalysisReportDetails
          onLinkSuggestionModule={() => undefined}
          report={report}
        />
      </div>
    )
  }

  function renderTabPanel(tab: typeof tabMeta[number]) {
    return (
      <div className="grid gap-2.5" role="tabpanel">
        <div className="rounded-[1.1rem] border border-zinc-200/80 bg-zinc-50/82 p-2.5 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          <strong className="block text-zinc-950 dark:text-white">
            {tab.label}
          </strong>
          <span className="mt-1.5 block">{tab.description}</span>
        </div>
        {tab.key === 'optimization'
          ? renderOptimizationPanel()
          : renderAnalysisPanel(tab.key)}
      </div>
    )
  }

  return (
    <AdminDrawerShell
      dialogClassName="max-w-[min(94vw,72rem)] !p-0"
      isOpen={isOpen}
      onClose={onClose}>
      <Drawer.Header className="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
        <div className="grid gap-2">
          <Drawer.Heading className="text-lg font-semibold text-zinc-950 dark:text-white">
            优化记录详情
          </Drawer.Heading>
          {entry ? (
            <div className="grid gap-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              <p>{entry.summary}</p>
              <p>
                {new Date(entry.createdAt).toLocaleString('zh-CN', {
                  hour12: false,
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                · {formatLocale(entry.locale)} · 已关联 {linkedCount}/3 个分析场景
              </p>
            </div>
          ) : null}
        </div>
        <Drawer.CloseTrigger aria-label="关闭优化记录详情" />
      </Drawer.Header>
      <Drawer.Body className="grid gap-3 px-3 py-2.5 md:px-4 md:py-3">
        {entry ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5">
              {entry.changedModules.map((module) => (
                <button
                  className="button button--sm button--outline h-8 rounded-full border-zinc-200/80 bg-zinc-50 px-3 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                  key={`${entry.resultId}-${module}`}
                  type="button">
                  {formatOptimizationModule(module)}
                </button>
              ))}
            </div>

            <div className="grid gap-2.5">
              <div
                aria-label="选择优化记录详情分组"
                className="flex flex-wrap gap-1 rounded-[1.1rem] border border-zinc-200/80 bg-zinc-50/82 p-1 dark:border-zinc-800 dark:bg-zinc-900/72"
                role="tablist">
                {tabMeta.map((tab) => {
                  const isSelected = selectedTab === tab.key

                  return (
                    <button
                      aria-selected={isSelected}
                      className={[
                        'button button--sm h-9 rounded-full px-4 text-sm font-medium whitespace-nowrap',
                        isSelected ? 'button--primary' : 'button--outline',
                      ].join(' ')}
                      data-selected={String(isSelected)}
                      key={tab.key}
                      onClick={() => setSelectedTab(tab.key)}
                      role="tab"
                      type="button">
                      {tab.label}
                    </button>
                  )
                })}
              </div>
              {renderTabPanel(tabMeta.find((tab) => tab.key === selectedTab) ?? tabMeta[0])}
            </div>
          </>
        ) : null}
      </Drawer.Body>
    </AdminDrawerShell>
  )
}

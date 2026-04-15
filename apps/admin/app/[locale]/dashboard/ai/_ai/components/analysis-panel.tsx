'use client'

import { useRequest } from 'alova/client'
import { Button } from '@heroui/react/button'
import { useRouter } from 'next/navigation'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  createFetchAiUsageHistoryMethod,
  createFetchAiUsageRecordDetailMethod,
  createGenerateAiResumeOptimizationMethod,
  createTriggerAiWorkbenchAnalysisMethod,
} from '../services/ai-workbench-api'
import type {
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
} from '../../../resume/_resume/types/resume.types'
import type {
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationResult,
  AiUsageRecordDetail,
  AiUsageRecordSummary,
  AiWorkbenchLocale,
  AiWorkbenchRuntimeSummary,
  AiWorkbenchScenario,
} from '../types/ai-workbench.types'
import { appendAnalysisUsageRelation } from '../utils/resume-optimization-persistence'
import { AnalysisForm } from './analysis-form'
import { AiAnalysisHistoryTable } from './ai-analysis-history-table'
import { AiAnalysisReportDrawer } from './ai-analysis-report-drawer'
import { ResumeOptimizationPendingOverlay } from './resume-optimization-pending-overlay'

interface AiAnalysisPanelProps {
  accessToken: string
  apiBaseUrl: string
  canAnalyze: boolean
  content: string
  createFetchUsageHistoryMethod?: typeof createFetchAiUsageHistoryMethod
  createFetchUsageRecordDetailMethod?: typeof createFetchAiUsageRecordDetailMethod
  createGenerateResumeOptimizationMethod?: typeof createGenerateAiResumeOptimizationMethod
  createTriggerAnalysisMethod?: typeof createTriggerAiWorkbenchAnalysisMethod
  draftSnapshot?: ResumeDraftSummarySnapshot | null
  helperMessage?: string | null
  inputAccessory?: ReactNode
  onDraftApplied?: (snapshot: ResumeDraftSnapshot) => void
  onContentChange: (value: string) => void
  onOptimizationGenerated?: (
    result: AiResumeOptimizationResult,
    instruction: string,
  ) => void
  runtimeSummary: AiWorkbenchRuntimeSummary
}

const HARD_TIMEOUT_MS = 180_000
const OPTIMIZATION_COMPLETE_DELAY_MS = 1_000
const PENDING_PROGRESS_ANCHORS = [
  { elapsedSeconds: 0, value: 0 },
  { elapsedSeconds: 5, value: 7 },
  { elapsedSeconds: 10, value: 15 },
  { elapsedSeconds: 15, value: 24 },
  { elapsedSeconds: 20, value: 36 },
  { elapsedSeconds: 25, value: 51 },
  { elapsedSeconds: 30, value: 70 },
] as const

function renderReadOnlyState(inputAccessory?: ReactNode) {
  return (
    <section className="card stack">
      {inputAccessory ? <div className="stack">{inputAccessory}</div> : null}
      <div>
        <p className="eyebrow">真实分析</p>
        <h2>当前角色只读</h2>
        <p className="muted">只有管理员可分析当前草稿、生成 diff，并写回新的草稿结果。</p>
      </div>
      <div className="readonly-box">
        viewer 当前只保留缓存报告体验。当前草稿优化、真实分析与草稿回写入口只在管理员链路中开放。
      </div>
    </section>
  )
}

function formatElapsedLabel(elapsedSeconds: number): string {
  if (elapsedSeconds < 60) {
    return `${elapsedSeconds}s`
  }

  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60

  return `${minutes}分 ${seconds.toString().padStart(2, '0')}秒`
}

function buildPendingState(elapsedSeconds: number) {
  if (elapsedSeconds >= 18) {
    return {
      stageTitle: '正在准备结果页',
      stageDescription: '已经拿到模型结果，正在整理概览、模块变化与结果页展示结构。',
    }
  }

  if (elapsedSeconds >= 10) {
    return {
      stageTitle: '正在整理结构化 diff',
      stageDescription: '正在把建议稿转换成模块级变更，便于后续按模块阅读与应用。',
    }
  }

  if (elapsedSeconds >= 4) {
    return {
      stageTitle: '正在调用 AI 生成建议',
      stageDescription: '模型正在结合当前草稿与岗位要求，生成新的结构化建议内容。',
    }
  }

  return {
    stageTitle: '正在读取当前草稿',
    stageDescription: '系统正在读取后台草稿，并构造本次 AI 分析所需的结构化上下文。',
  }
}

function buildCompletingPendingState() {
  return {
    stageTitle: '分析完成，正在进入结果页',
    stageDescription: '优化建议已经准备完成，正在展示 100% 完成态并跳转到结果页。',
  }
}

export function buildPendingProgress(
  elapsedSeconds: number,
  isCompleting = false,
): number {
  if (isCompleting) {
    return 100
  }

  if (elapsedSeconds <= 0) {
    return 0
  }

  if (elapsedSeconds <= 30) {
    const nextAnchorIndex = PENDING_PROGRESS_ANCHORS.findIndex(
      (anchor) => elapsedSeconds <= anchor.elapsedSeconds,
    )
    const nextAnchor = PENDING_PROGRESS_ANCHORS[nextAnchorIndex]
    const previousAnchor = PENDING_PROGRESS_ANCHORS[nextAnchorIndex - 1]

    if (!previousAnchor || !nextAnchor) {
      return 0
    }

    const elapsedRange = nextAnchor.elapsedSeconds - previousAnchor.elapsedSeconds
    const valueRange = nextAnchor.value - previousAnchor.value
    const elapsedOffset = elapsedSeconds - previousAnchor.elapsedSeconds

    return Math.round(previousAnchor.value + (elapsedOffset / elapsedRange) * valueRange)
  }

  const steppedValue = 70 + Math.floor((elapsedSeconds - 30) / 5) * 5

  return Math.min(95, steppedValue)
}

function buildPendingStage(elapsedSeconds: number, isCompleting: boolean) {
  if (isCompleting) {
    return buildCompletingPendingState()
  }

  return buildPendingState(elapsedSeconds)
}

function buildDrawerRecordFromReport(input: {
  report: AiUsageRecordDetail['detail']
  reportId: string
  scenario: AiWorkbenchScenario
  locale: AiWorkbenchLocale
  summary: string
  providerSummary: AiWorkbenchRuntimeSummary
  usageRecordId: string
}): AiUsageRecordDetail {
  const detailReport = input.report as {
    createdAt?: string
    generator?: 'mock-cache' | 'ai-provider'
    score?: {
      label?: string
      value?: number
    }
  }

  return {
    id: input.usageRecordId,
    operationType: 'analysis-report',
    scenario: input.scenario,
    locale: input.locale,
    inputPreview: '',
    summary: input.summary,
    provider: input.providerSummary.provider,
    model: input.providerSummary.model,
    mode: input.providerSummary.mode,
    generator: detailReport.generator ?? 'ai-provider',
    status: 'succeeded',
    relatedReportId: input.reportId,
    relatedResultId: null,
    errorMessage: null,
    durationMs: 0,
    createdAt: detailReport.createdAt ?? new Date().toISOString(),
    scoreLabel: detailReport.score?.label,
    scoreValue: detailReport.score?.value,
    detail: input.report,
  }
}

export function AiAnalysisPanel({
  accessToken,
  apiBaseUrl,
  canAnalyze,
  content,
  createFetchUsageHistoryMethod = createFetchAiUsageHistoryMethod,
  createFetchUsageRecordDetailMethod = createFetchAiUsageRecordDetailMethod,
  createGenerateResumeOptimizationMethod = createGenerateAiResumeOptimizationMethod,
  createTriggerAnalysisMethod = createTriggerAiWorkbenchAnalysisMethod,
  draftSnapshot,
  helperMessage,
  inputAccessory,
  onContentChange,
  onOptimizationGenerated,
  runtimeSummary,
}: AiAnalysisPanelProps) {
  const router = useRouter()
  const [scenario, setScenario] = useState<AiWorkbenchScenario>('resume-review')
  const [locale, setLocale] = useState<AiWorkbenchLocale>('zh')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [suggestionFeedbackMessage, setSuggestionFeedbackMessage] = useState<string | null>(
    null,
  )
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isOptimizationCompleting, setIsOptimizationCompleting] = useState(false)
  const [latestResultId, setLatestResultId] = useState<string | null>(null)
  const [historyRecords, setHistoryRecords] = useState<AiUsageRecordSummary[]>([])
  const [activeHistoryRecord, setActiveHistoryRecord] = useState<AiUsageRecordDetail | null>(
    null,
  )
  const [historyErrorMessage, setHistoryErrorMessage] = useState<string | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const optimizeAbortControllerRef = useRef<AbortController | null>(null)
  const optimizeTimeoutRef = useRef<number | null>(null)
  const optimizationCompleteDelayRef = useRef<number | null>(null)
  const cancelReasonRef = useRef<'timeout' | 'user' | null>(null)
  const historyRequestKeyRef = useRef<string | null>(null)
  const {
    loading: historyLoading,
    send: fetchUsageHistory,
  } = useRequest(
    () =>
      createFetchUsageHistoryMethod({
        apiBaseUrl,
        accessToken,
        type: 'analysis-report',
        limit: 20,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const {
    loading: historyDetailLoading,
    send: fetchUsageRecordDetail,
  } = useRequest(
    (recordId: string) =>
      createFetchUsageRecordDetailMethod({
        apiBaseUrl,
        accessToken,
        recordId,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const {
    loading: triggerPending,
    send: triggerAnalysisRequest,
  } = useRequest(
    (payload: {
      content: string
      locale: AiWorkbenchLocale
      scenario: AiWorkbenchScenario
    }) =>
      createTriggerAnalysisMethod({
        apiBaseUrl,
        accessToken,
        scenario: payload.scenario,
        locale: payload.locale,
        content: payload.content,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const {
    loading: generatePending,
    send: generateSuggestionRequest,
  } = useRequest(
    (payload: {
      instruction: string
      locale: AiWorkbenchLocale
      requestInit?: { signal?: AbortSignal }
    }) =>
      createGenerateResumeOptimizationMethod({
        apiBaseUrl,
        accessToken,
        instruction: payload.instruction,
        locale: payload.locale,
        requestInit: payload.requestInit,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const pending = triggerPending
  const suggestionPending = generatePending

  useEffect(() => {
    if (!canAnalyze) {
      return
    }

    const requestKey = `${apiBaseUrl}:${accessToken}:analysis-history`

    if (historyRequestKeyRef.current === requestKey) {
      return
    }

    historyRequestKeyRef.current = requestKey
    void refreshAnalysisHistory()
  }, [accessToken, apiBaseUrl, canAnalyze])

  useEffect(() => {
    if (!suggestionPending) {
      if (!isOptimizationCompleting) {
        setElapsedSeconds(0)
      }
      return
    }

    const intervalId = window.setInterval(() => {
      setElapsedSeconds((currentValue) => currentValue + 1)
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [isOptimizationCompleting, suggestionPending])

  useEffect(() => {
    return () => {
      if (optimizeTimeoutRef.current) {
        clearTimeout(optimizeTimeoutRef.current)
      }

      if (optimizationCompleteDelayRef.current) {
        clearTimeout(optimizationCompleteDelayRef.current)
      }

      optimizeAbortControllerRef.current?.abort()
    }
  }, [])

  const optimizationPendingVisible = suggestionPending || isOptimizationCompleting
  const pendingStage = useMemo(
    () =>
      optimizationPendingVisible
        ? buildPendingStage(elapsedSeconds, isOptimizationCompleting)
        : null,
    [elapsedSeconds, isOptimizationCompleting, optimizationPendingVisible],
  )
  const pendingProgressValue = useMemo(
    () => buildPendingProgress(elapsedSeconds, isOptimizationCompleting),
    [elapsedSeconds, isOptimizationCompleting],
  )

  const pendingHint = useMemo(() => {
    if (!optimizationPendingVisible || isOptimizationCompleting) {
      return null
    }

    if (elapsedSeconds >= 90) {
      return '本次分析耗时较长，可继续等待或取消后稍微缩短 JD 再试一次。'
    }

    if (elapsedSeconds >= 15) {
      return '模型仍在处理中，请继续等待；建议保持当前页面开启。'
    }

    return null
  }, [elapsedSeconds, isOptimizationCompleting, optimizationPendingVisible])

  if (!canAnalyze) {
    return renderReadOnlyState(inputAccessory)
  }

  async function refreshAnalysisHistory() {
    try {
      const records = await fetchUsageHistory()
      setHistoryErrorMessage(null)
      setHistoryRecords(records)
      return records
    } catch (error) {
      setHistoryErrorMessage(
        error instanceof Error
          ? `AI 调用记录加载失败：${error.message}。请确认服务端数据库已执行 db:push。`
          : 'AI 调用记录加载失败，请确认服务端数据库已执行 db:push。',
      )
      setHistoryRecords([])
      return []
    }
  }

  async function openHistoryDrawer(recordId: string) {
    try {
      const detail = await fetchUsageRecordDetail(recordId)
      setHistoryErrorMessage(null)
      setActiveHistoryRecord(detail)
      setIsDrawerOpen(true)
    } catch (error) {
      setHistoryErrorMessage(
        error instanceof Error
          ? `AI 调用记录详情加载失败：${error.message}`
          : 'AI 调用记录详情加载失败，请稍后重试。',
      )
    }
  }

  function clearPendingController() {
    if (optimizeTimeoutRef.current) {
      clearTimeout(optimizeTimeoutRef.current)
      optimizeTimeoutRef.current = null
    }

    if (optimizationCompleteDelayRef.current) {
      clearTimeout(optimizationCompleteDelayRef.current)
      optimizationCompleteDelayRef.current = null
    }

    optimizeAbortControllerRef.current = null
    cancelReasonRef.current = null
  }

  async function waitForOptimizationCompletionDelay() {
    await new Promise<void>((resolve) => {
      optimizationCompleteDelayRef.current = window.setTimeout(() => {
        optimizationCompleteDelayRef.current = null
        resolve()
      }, OPTIMIZATION_COMPLETE_DELAY_MS)
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedContent = content.trim()

    if (!normalizedContent) {
      setErrorMessage('请先输入 JD、目标岗位或分析要求，再生成辅助分析报告。')
      return
    }

    setErrorMessage(null)

    try {
      const result = await triggerAnalysisRequest({
        content: normalizedContent,
        locale,
        scenario,
      })

      appendAnalysisUsageRelation({
        content: normalizedContent,
        scenario: result.report.scenario,
        usageRecordId: result.usageRecordId,
      })

      setActiveHistoryRecord(
        buildDrawerRecordFromReport({
          report: result.report,
          reportId: result.report.reportId,
          scenario: result.report.scenario,
          locale: result.report.locale,
          summary: result.report.summary,
          providerSummary: runtimeSummary,
          usageRecordId: result.usageRecordId,
        }),
      )
      setIsDrawerOpen(true)
      await refreshAnalysisHistory()
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : '真实分析触发失败，请稍后重试',
      )
      void refreshAnalysisHistory()
    }
  }

  function handleLinkSuggestionModule(module: AiResumeOptimizationChangedModule) {
    if (!latestResultId) {
      setSuggestionFeedbackMessage(
        '结构化建议已迁移到独立结果页，请先分析当前草稿并进入结果页查看具体模块。',
      )
      return
    }

    router.push(`/dashboard/ai/resume-optimization/results/${latestResultId}#module-${module}`)
  }

  function cancelCurrentOptimization() {
    if (!optimizeAbortControllerRef.current) {
      return
    }

    cancelReasonRef.current = 'user'
    optimizeAbortControllerRef.current.abort()
  }

  async function handleGenerateSuggestion() {
    const normalizedContent = content.trim()

    if (!normalizedContent) {
      setSuggestionFeedbackMessage('请先输入 JD、目标岗位或优化要求，再分析当前草稿。')
      return
    }

    setSuggestionFeedbackMessage(null)
    setElapsedSeconds(0)
    setIsOptimizationCompleting(false)

    const nextAbortController = new AbortController()
    optimizeAbortControllerRef.current = nextAbortController
    optimizeTimeoutRef.current = window.setTimeout(() => {
      cancelReasonRef.current = 'timeout'
      nextAbortController.abort()
    }, HARD_TIMEOUT_MS)

    try {
      const result = await generateSuggestionRequest({
        instruction: normalizedContent,
        locale,
        requestInit: {
          signal: nextAbortController.signal,
        },
      })

      onOptimizationGenerated?.(result, normalizedContent)
      setLatestResultId(result.resultId)
      setIsOptimizationCompleting(true)
      await Promise.all([refreshAnalysisHistory(), waitForOptimizationCompletionDelay()])
      router.push(`/dashboard/ai/resume-optimization/results/${result.resultId}`)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setSuggestionFeedbackMessage(
          cancelReasonRef.current === 'timeout'
            ? '本次分析超时，请缩短 JD 或稍后重试。'
            : '已取消本次分析，可继续调整要求后重新生成。',
        )
        return
      }

      setSuggestionFeedbackMessage(
        error instanceof Error ? error.message : '结构化简历建议生成失败，请稍后重试',
      )
    } finally {
      setIsOptimizationCompleting(false)
      clearPendingController()
    }
  }

  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">当前草稿优化</p>
        <h2>先基于当前草稿生成结构化建议</h2>
        <p className="muted">
          当前阶段把简历优化主路径收口为“当前草稿 + 优化要求”。服务端会读取 DB
          当前草稿、生成模块级 diff，并在独立结果页中承接后续阅读与应用。
        </p>
      </div>

      <div className="relative">
        {pendingStage ? (
          <ResumeOptimizationPendingOverlay
            elapsedLabel={formatElapsedLabel(elapsedSeconds)}
            hint={pendingHint}
            onCancel={isOptimizationCompleting ? undefined : cancelCurrentOptimization}
            progressValue={pendingProgressValue}
            stageDescription={pendingStage.stageDescription}
            stageTitle={pendingStage.stageTitle}
          />
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <AnalysisForm
            content={content}
            draftSnapshot={draftSnapshot}
            errorMessage={errorMessage}
            helperMessage={helperMessage}
            inputAccessory={inputAccessory}
            locale={locale}
            onChangeLocale={setLocale}
            onContentChange={onContentChange}
            onGenerateSuggestion={() => void handleGenerateSuggestion()}
            onSubmit={(event) => void handleSubmit(event)}
            onUpdateScenario={setScenario}
            pending={pending}
            scenario={scenario}
            suggestionFeedbackMessage={suggestionFeedbackMessage}
            suggestionPending={suggestionPending}
          />

          <div className="stack self-start">
            <section className="grid gap-4 rounded-[1.75rem] border border-zinc-200/80 bg-white/85 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="grid gap-2">
                <p className="eyebrow">分析记录</p>
                <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-white">
                  辅助分析调用留痕
                </h3>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  不同分析场景会以记录表方式保留。你可以先看列表，再通过 Drawer
                  查看结论层、依据层、风险层和建议动作。
                </p>
              </div>

              {historyErrorMessage ? (
                <div className="grid gap-3 rounded-[1.25rem] border border-red-200/80 bg-red-50/80 p-4 dark:border-red-400/20 dark:bg-red-500/10">
                  <span className="text-sm text-red-700 dark:text-red-200">
                    {historyErrorMessage}
                  </span>
                  <Button onPress={() => void refreshAnalysisHistory()} size="sm" variant="outline">
                    重试分析记录读取
                  </Button>
                </div>
              ) : null}

              {historyLoading ? (
                <div className="grid gap-2" data-testid="analysis-history-loading">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    正在加载辅助分析记录...
                  </span>
                  <div className="h-32 rounded-[1.25rem] bg-zinc-100/80 dark:bg-zinc-900/60" />
                </div>
              ) : (
                <AiAnalysisHistoryTable
                  onOpenDetail={(recordId) => void openHistoryDrawer(recordId)}
                  records={historyRecords}
                />
              )}
            </section>
          </div>
        </div>
      </div>

      <AiAnalysisReportDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLinkSuggestionModule={handleLinkSuggestionModule}
        record={activeHistoryRecord}
      />

      {historyDetailLoading ? (
        <span className="hidden" data-testid="analysis-history-detail-loading" />
      ) : null}
    </section>
  )
}

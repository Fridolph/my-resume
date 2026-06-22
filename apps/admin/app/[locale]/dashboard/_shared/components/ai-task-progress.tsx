'use client'

import { Button } from '@heroui/react/button'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { DEFAULT_API_BASE_URL } from '@core/env'
import { useRouter } from '@i18n/navigation'

import {
  createFetchAiResumeImportJobMethod,
  streamAiResumeImportJob,
} from '../../ai/_ai/services/ai-workbench-api'
import type {
  AiResumeImportJob,
  AiResumeImportJobStage,
} from '../../ai/_ai/types/ai-workbench.types'

export const ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY =
  'my-resume:ai:resume-import:active-job-id'

const TERMINAL_TOAST_VISIBLE_MS = 12_000
const RESUME_IMPORT_PROGRESS_STAGES: AiResumeImportJobStage[] = [
  'accepted',
  'extracting',
  'text_validating',
  'raw_archiving',
  'format_normalizing',
  'safety_filtering',
  'ai_generating',
  'json_parsing',
  'schema_validating',
  'diff_building',
]
const RUNNING_STAGE_PROGRESS_RATIO = 0.45

interface AiTaskProgressContextValue {
  resumeImportJob: AiResumeImportJob | null
  displayElapsedMs: number
  lastHeartbeatAt: string | null
  progressHint: string | null
  connectionError: string | null
  restoringJobId: string | null
  registerResumeImportJob: (job: AiResumeImportJob) => void
  refreshResumeImportJob: () => Promise<void>
}

const AiTaskProgressContext = createContext<AiTaskProgressContextValue | null>(null)

export function formatAiTaskElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 1000) {
    return '0 秒'
  }

  const totalSeconds = Math.floor(ms / 1000)

  if (totalSeconds < 60) {
    return `${totalSeconds} 秒`
  }

  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes} 分 ${seconds} 秒`
}

function resolveFiniteElapsedMs(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : fallback
}

function resolveTimestampMs(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) {
    return null
  }

  const timestamp = new Date(value).getTime()

  return Number.isFinite(timestamp) ? timestamp : null
}

function normalizeClientError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

  if (/AbortError/i.test(message)) {
    return ''
  }

  if (/Failed to fetch|ERR_CONNECTION|NetworkError/i.test(message)) {
    return '实时连接中断，可手动刷新状态。'
  }

  return message || 'AI 任务状态同步失败'
}

function readActiveResumeImportJobId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY)
}

function writeActiveResumeImportJobId(jobId: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY, jobId)
}

function clearActiveResumeImportJobId(jobId?: string) {
  if (typeof window === 'undefined') {
    return
  }

  const currentJobId = readActiveResumeImportJobId()

  if (jobId && currentJobId && currentJobId !== jobId) {
    return
  }

  window.localStorage.removeItem(ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY)
}

function resumeImportStatusLabel(status: AiResumeImportJob['status']): string {
  const labels: Record<AiResumeImportJob['status'], string> = {
    running: '识别中',
    completed: '已完成',
    failed: '失败',
  }

  return labels[status]
}

function stepLabel(job: AiResumeImportJob | null): string {
  if (!job) {
    return '等待任务'
  }

  return job.steps.find((step) => step.stage === job.currentStage)?.label ?? job.currentStage
}

function heartbeatLabel(timestamp: string | null): string {
  if (!timestamp) {
    return '正在建立实时连接'
  }

  return `最近心跳 ${formatAiTaskElapsed(Math.max(0, Date.now() - new Date(timestamp).getTime()))}前`
}

function statusToneClass(status: AiResumeImportJob['status']): string {
  if (status === 'failed') {
    return 'text-red-600 dark:text-red-300'
  }

  if (status === 'completed') {
    return 'text-emerald-600 dark:text-emerald-300'
  }

  return 'text-blue-600 dark:text-blue-300'
}

function resolveResumeImportProgressPercent(
  job: AiResumeImportJob | null,
  displayElapsedMs: number,
): number {
  if (!job) {
    return 0
  }

  if (job.status === 'completed') {
    return 100
  }

  const stageWeight = 100 / RESUME_IMPORT_PROGRESS_STAGES.length
  const currentStageIndex = RESUME_IMPORT_PROGRESS_STAGES.indexOf(job.currentStage)
  const completedStageSet = new Set(
    job.steps
      .filter((step) => step.status === 'completed')
      .map((step) => step.stage),
  )
  const completedCount = RESUME_IMPORT_PROGRESS_STAGES.filter((stage) =>
    completedStageSet.has(stage),
  ).length
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : completedCount
  const runningBonus =
    job.status === 'running' ? stageWeight * RUNNING_STAGE_PROGRESS_RATIO : 0
  const basePercent = Math.max(completedCount * stageWeight, activeIndex * stageWeight)

  // 感知进度只服务等待体验：早期任务不瞬间跳满，失败态也保留最后可解释位置。
  const elapsedBonus = Math.min(6, Math.floor(displayElapsedMs / 5000))
  const percent = basePercent + runningBonus + elapsedBonus
  const perceivedAiGeneratingCap =
    job.status === 'running' && job.currentStage === 'ai_generating' && displayElapsedMs < 30_000
      ? 18 + Math.floor(displayElapsedMs / 5000) * 8
      : null
  const maxPercent = job.status === 'failed' ? 99 : 96

  return Math.max(
    1,
    Math.min(maxPercent, perceivedAiGeneratingCap ?? maxPercent, Math.round(percent)),
  )
}

export function AiTaskStatusChip({
  status,
}: {
  status: AiResumeImportJob['status'] | AiResumeImportJob['steps'][number]['status']
}) {
  const classMap: Record<typeof status, string> = {
    pending: 'border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400',
    running:
      'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-200',
    completed:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-200',
    failed:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-200',
  }
  const labelMap: Record<typeof status, string> = {
    pending: '等待中',
    running: '进行中',
    completed: '已完成',
    failed: '失败',
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${classMap[status]}`}
      data-testid={`ai-task-status-chip-${status}`}>
      <span className="relative inline-flex size-2">
        {status === 'running' ? (
          <span className="absolute inline-flex size-2 animate-ping rounded-full bg-blue-400 opacity-40" />
        ) : null}
        <span
          className={`relative inline-flex size-2 rounded-full ${
            status === 'running'
              ? 'animate-pulse bg-blue-500'
              : status === 'completed'
                ? 'bg-emerald-500'
                : status === 'failed'
                  ? 'bg-red-500'
                  : 'bg-zinc-400'
          }`}
        />
      </span>
      {labelMap[status]}
    </span>
  )
}

export function AiTaskProgressProvider({
  accessToken,
  children,
}: {
  accessToken: string
  children: ReactNode
}) {
  const router = useRouter()
  const [resumeImportJob, setResumeImportJob] = useState<AiResumeImportJob | null>(null)
  const [displayElapsedMs, setDisplayElapsedMs] = useState(0)
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null)
  const [progressHint, setProgressHint] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [restoringJobId, setRestoringJobId] = useState<string | null>(null)
  const [toastDismissed, setToastDismissed] = useState(false)
  const completedJobIdRef = useRef<string | null>(null)
  const restoredJobIdRef = useRef<string | null>(null)

  const handleJobUpdate = useCallback(
    (nextJob: AiResumeImportJob) => {
      setResumeImportJob(nextJob)
      setToastDismissed(false)

      if (nextJob.status === 'running') {
        writeActiveResumeImportJobId(nextJob.jobId)
        setConnectionError(null)
      } else {
        clearActiveResumeImportJobId(nextJob.jobId)
        setDisplayElapsedMs((current) =>
          resolveFiniteElapsedMs(nextJob.elapsedMs, current),
        )
        setLastHeartbeatAt(null)
        setProgressHint(null)
        window.setTimeout(() => setToastDismissed(true), TERMINAL_TOAST_VISIBLE_MS)
      }

      if (nextJob.status === 'completed' && nextJob.resultId) {
        if (completedJobIdRef.current === nextJob.jobId) {
          return
        }

        completedJobIdRef.current = nextJob.jobId
        router.push(`/dashboard/ai/resume-import/results/${nextJob.resultId}`)
      }
    },
    [router],
  )

  const refreshResumeImportJob = useCallback(async () => {
    if (!resumeImportJob) {
      return
    }

    const nextJob = await createFetchAiResumeImportJobMethod({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
      jobId: resumeImportJob.jobId,
    }).send()

    handleJobUpdate(nextJob)
  }, [accessToken, handleJobUpdate, resumeImportJob])

  const registerResumeImportJob = useCallback(
    (job: AiResumeImportJob) => {
      completedJobIdRef.current = null
      setLastHeartbeatAt(null)
      setProgressHint(null)
      setConnectionError(null)
      handleJobUpdate(job)
    },
    [handleJobUpdate],
  )

  useEffect(() => {
    const activeJobId = readActiveResumeImportJobId()

    if (!activeJobId || restoredJobIdRef.current === activeJobId) {
      return
    }

    restoredJobIdRef.current = activeJobId
    setRestoringJobId(activeJobId)

    createFetchAiResumeImportJobMethod({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
      jobId: activeJobId,
    })
      .send()
      .then(handleJobUpdate)
      .catch((error: unknown) => {
        const message = normalizeClientError(error)

        if (/404|not found|不存在|未找到/i.test(message)) {
          clearActiveResumeImportJobId(activeJobId)
        } else if (message) {
          setConnectionError(`未能恢复上一次识别任务：${message}`)
        }
      })
      .finally(() => setRestoringJobId(null))
  }, [accessToken, handleJobUpdate])

  useEffect(() => {
    if (!resumeImportJob) {
      setDisplayElapsedMs(0)
      return
    }

    if (resumeImportJob.status !== 'running') {
      setDisplayElapsedMs((current) =>
        resolveFiniteElapsedMs(resumeImportJob.elapsedMs, current),
      )
      return
    }

    const createdAtTime = resolveTimestampMs(resumeImportJob.createdAt)
    const fallbackElapsedMs = resolveFiniteElapsedMs(resumeImportJob.elapsedMs)

    if (createdAtTime === null) {
      setDisplayElapsedMs(fallbackElapsedMs)
      return
    }

    const updateElapsed = () => {
      setDisplayElapsedMs(Math.max(0, Date.now() - createdAtTime))
    }

    updateElapsed()
    const intervalId = window.setInterval(updateElapsed, 1000)

    return () => window.clearInterval(intervalId)
  }, [resumeImportJob])

  useEffect(() => {
    if (!resumeImportJob || resumeImportJob.status !== 'running') {
      return
    }

    const abortController = new AbortController()

    void streamAiResumeImportJob(
      {
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken,
        jobId: resumeImportJob.jobId,
        signal: abortController.signal,
      },
      {
        onSnapshot: handleJobUpdate,
        onCompleted: handleJobUpdate,
        onFailed: handleJobUpdate,
        onHeartbeat: (heartbeat) => setLastHeartbeatAt(heartbeat.timestamp),
        onProgressHint: (hint) => setProgressHint(hint.message),
      },
    ).catch((error: unknown) => {
      if (abortController.signal.aborted) {
        return
      }

      const message = normalizeClientError(error)

      if (message) {
        setConnectionError(message)
      }
    })

    return () => abortController.abort()
  }, [accessToken, handleJobUpdate, resumeImportJob?.jobId, resumeImportJob?.status])

  const value = useMemo<AiTaskProgressContextValue>(
    () => ({
      resumeImportJob,
      displayElapsedMs,
      lastHeartbeatAt,
      progressHint,
      connectionError,
      restoringJobId,
      registerResumeImportJob,
      refreshResumeImportJob,
    }),
    [
      connectionError,
      displayElapsedMs,
      lastHeartbeatAt,
      progressHint,
      refreshResumeImportJob,
      registerResumeImportJob,
      restoringJobId,
      resumeImportJob,
    ],
  )

  return (
    <AiTaskProgressContext.Provider value={value}>
      {children}
      <AiTaskProgressToast hidden={toastDismissed} />
    </AiTaskProgressContext.Provider>
  )
}

export function useAiTaskProgress() {
  const value = useContext(AiTaskProgressContext)

  if (!value) {
    throw new Error('useAiTaskProgress must be used inside AiTaskProgressProvider')
  }

  return value
}

function AiTaskProgressToast({ hidden }: { hidden: boolean }) {
  const router = useRouter()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const {
    resumeImportJob,
    displayElapsedMs,
    lastHeartbeatAt,
    progressHint,
    connectionError,
    restoringJobId,
    refreshResumeImportJob,
  } = useAiTaskProgress()

  if ((!resumeImportJob && !restoringJobId) || hidden) {
    return null
  }

  const status = resumeImportJob?.status ?? 'running'
  const canViewResult = resumeImportJob?.status === 'completed' && resumeImportJob.resultId
  const progressPercent = resolveResumeImportProgressPercent(
    resumeImportJob,
    displayElapsedMs,
  )
  const statusTone = statusToneClass(status)

  if (isCollapsed) {
    return (
      <Button
        aria-label="展开 AI 简历导入识别进度"
        aria-live="polite"
        className="fixed right-4 top-4 z-50 grid min-w-[8.25rem] gap-1 rounded-[22px] border border-white/70 bg-white/92 px-3.5 py-3 text-left shadow-[0_18px_60px_rgba(15,23,42,0.14)] ring-1 ring-zinc-950/5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_22px_70px_rgba(15,23,42,0.18)] dark:border-zinc-800/80 dark:bg-zinc-950/92 dark:ring-white/10 sm:right-5 sm:top-5"
        data-testid="ai-task-progress-mini"
        onPress={() => setIsCollapsed(false)}
        type="button"
        variant="ghost">
        <span className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
            AI Task
          </span>
          <span className="relative inline-flex size-2.5">
            {status === 'running' ? (
              <span className="absolute inline-flex size-2.5 animate-ping rounded-full bg-blue-400 opacity-35" />
            ) : null}
            <span
              className={`relative inline-flex size-2.5 rounded-full ${
                status === 'completed'
                  ? 'bg-emerald-500'
                  : status === 'failed'
                    ? 'bg-red-500'
                    : 'bg-blue-500'
              }`}
            />
          </span>
        </span>
        <strong className={`text-2xl font-semibold tabular-nums ${statusTone}`}>
          {status === 'failed' ? '失败' : `${progressPercent}%`}
        </strong>
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          简历导入识别
        </span>
      </Button>
    )
  }

  return (
    <aside
      aria-live="polite"
      role="status"
      className="fixed inset-x-3 bottom-3 z-50 overflow-hidden rounded-[30px] border border-white/70 bg-white/94 shadow-[0_24px_80px_rgba(15,23,42,0.16)] ring-1 ring-zinc-950/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/94 dark:ring-white/10 md:inset-x-auto md:bottom-auto md:right-5 md:top-5 md:w-[25rem]"
      data-testid="ai-task-progress-toast">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-zinc-100 dark:bg-zinc-900">
        <div
          className={`h-full rounded-r-full transition-all duration-500 ${
            status === 'failed'
              ? 'bg-red-500'
              : status === 'completed'
                ? 'bg-emerald-500'
                : 'bg-blue-500'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <div className="grid gap-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
              AI Task
            </p>
            <h2 className="truncate text-base font-semibold text-zinc-950 dark:text-white">
              简历导入识别
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AiTaskStatusChip status={status} />
            <Button
              aria-label="缩小 AI 任务进度"
              onPress={() => setIsCollapsed(true)}
              size="sm"
              type="button"
              variant="ghost">
              缩小
            </Button>
          </div>
        </div>

        <div className="rounded-[22px] border border-zinc-200/75 bg-zinc-50/80 p-3 dark:border-zinc-800/80 dark:bg-zinc-900/60">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {restoringJobId && !resumeImportJob
              ? `正在恢复任务 ${restoringJobId}`
              : stepLabel(resumeImportJob)}
          </span>
          <p className="mt-1 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {progressHint ??
              connectionError ??
              (status === 'running'
                ? '正在保持实时连接，任务完成后会自动进入结果页。'
                : resumeImportStatusLabel(status))}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto] items-end gap-4">
          <div className="grid gap-1">
            <span className="text-xs text-zinc-400">已耗时</span>
            <strong className={`text-3xl font-semibold tabular-nums ${statusTone}`}>
              {formatAiTaskElapsed(displayElapsedMs)}
            </strong>
          </div>
          <div className="grid justify-items-end gap-1">
            <span className={`text-2xl font-semibold tabular-nums ${statusTone}`}>
              {status === 'failed' ? '失败' : `${progressPercent}%`}
            </span>
            <span className="text-right text-xs text-zinc-400">
              {heartbeatLabel(lastHeartbeatAt)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-zinc-200/75 pt-3 dark:border-zinc-800/80">
          <Button
            onPress={() => {
              if (canViewResult) {
                router.push(
                  `/dashboard/ai/resume-import/results/${resumeImportJob.resultId}`,
                )
                return
              }

              router.push('/dashboard/ai/resume-import')
            }}
            size="sm"
            type="button"
            variant="primary">
            {canViewResult ? '查看结果' : '查看进度'}
          </Button>
          {status === 'running' ? (
            <Button
              onPress={() => void refreshResumeImportJob()}
              size="sm"
              type="button"
              variant="outline">
              刷新
            </Button>
          ) : null}
          <Button
            onPress={() => setIsCollapsed(true)}
            size="sm"
            type="button"
            variant="ghost">
            缩小
          </Button>
        </div>
      </div>
    </aside>
  )
}

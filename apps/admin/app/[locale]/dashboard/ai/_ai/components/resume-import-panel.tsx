'use client'

import { useRequest } from 'alova/client'
import { Accordion, Button, Form, Input } from '@heroui/react'
import { formatFileSize } from '@my-resume/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { adminPrimaryButtonClass } from '@core/button-styles'

import {
  createFetchAiResumeImportJobMethod,
  createRecognizeAiResumeImportMethod,
  streamAiResumeImportJob,
} from '../services/ai-workbench-api'
import type { AiResumeImportJob } from '../types/ai-workbench.types'

const ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY = 'my-resume:ai:resume-import:active-job-id'

interface ResumeImportPanelProps {
  /** API 服务根地址。 */
  apiBaseUrl: string
  /** 当前管理员访问令牌，用于调用受保护的 AI 接口。 */
  accessToken: string
  /** 当前角色是否允许上传并触发简历导入识别。 */
  canUpload: boolean
  /** 测试注入点：构造读取 Job 状态的 API method。 */
  createFetchResumeImportJobMethod?: typeof createFetchAiResumeImportJobMethod
  /** 测试注入点：构造启动识别任务的 API method。 */
  createRecognizeResumeImportMethod?: typeof createRecognizeAiResumeImportMethod
  /** 测试注入点：订阅 Job SSE 事件。 */
  streamResumeImportJobMethod?: typeof streamAiResumeImportJob
  /** 识别完成后的回调，通常用于记录或跳转前的扩展。 */
  onRecognized?: (job: AiResumeImportJob) => void
  /** 本地已耗时计时刷新间隔。 */
  elapsedTickMs?: number
  /** 兼容旧测试参数：SSE 版不再自动轮询。 */
  initialPollIntervalMs?: number
  /** 兼容旧测试参数：SSE 版不再自动轮询。 */
  slowPollAfterMs?: number
  /** 兼容旧测试参数：SSE 版不再自动轮询。 */
  slowPollIntervalMs?: number
}

function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 1000) {
    return '0 秒'
  }

  return `${Math.floor(ms / 1000)} 秒`
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

function formatHeartbeatDistance(timestamp: string | null): string {
  if (!timestamp) {
    return '正在建立实时连接'
  }

  return `实时连接正常，最近心跳 ${formatElapsed(
    Math.max(0, Date.now() - new Date(timestamp).getTime()),
  )}前`
}

function normalizeClientError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

  if (/AbortError/i.test(message)) {
    return ''
  }

  if (/Failed to fetch|ERR_CONNECTION|NetworkError/i.test(message)) {
    return '请求未到达服务端或连接已中断，请确认 server 正在运行后重试。'
  }

  return message || '简历导入识别失败，请稍后重试'
}

function statusLabel(status: AiResumeImportJob['status']): string {
  const labels: Record<AiResumeImportJob['status'], string> = {
    running: '识别中',
    completed: '已完成',
    failed: '失败',
  }

  return labels[status]
}

function stepStatusLabel(status: AiResumeImportJob['steps'][number]['status']): string {
  const labels: Record<AiResumeImportJob['steps'][number]['status'], string> = {
    pending: '等待中',
    running: '进行中',
    completed: '已完成',
    failed: '失败',
  }

  return labels[status]
}

function statusDotClass(status: AiResumeImportJob['steps'][number]['status']): string {
  const classMap: Record<AiResumeImportJob['steps'][number]['status'], string> = {
    pending: 'bg-zinc-300 dark:bg-zinc-700',
    running: 'bg-blue-500 shadow-[0_0_0_6px_rgba(59,130,246,0.12)]',
    completed: 'bg-emerald-500',
    failed: 'bg-red-500 shadow-[0_0_0_6px_rgba(239,68,68,0.12)]',
  }

  return classMap[status]
}

function runningStepHint(stage: AiResumeImportJob['currentStage']): string {
  if (stage === 'format_normalizing') {
    return '规则层正在快速清洗输入文本并准备识别中间稿；不会额外调用 AI。'
  }

  if (stage === 'safety_filtering') {
    return '规则层正在快速过滤明显无关、广告或提示词注入内容，并保留治理报告。'
  }

  if (stage === 'ai_generating') {
    return '单次 AI 调用会同时生成候选草稿和输入治理报告，通常需要 3-5 分钟；完成后会自动进入结果看台。'
  }

  return '任务正在推进中，实时事件会在阶段变化时自动更新。'
}

function resolveAutoExpandedStepKeys(job: AiResumeImportJob | null): Set<string> {
  if (!job) {
    return new Set()
  }

  return new Set(
    resolveJobSteps(job)
      .filter((step) => step.status === 'running' || step.status === 'failed')
      .map((step) => step.stage),
  )
}

function resolveJobSteps(job: AiResumeImportJob | null): AiResumeImportJob['steps'] {
  return Array.isArray(job?.steps) ? job.steps : []
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

export function ResumeImportPanel({
  apiBaseUrl,
  accessToken,
  canUpload,
  createFetchResumeImportJobMethod = createFetchAiResumeImportJobMethod,
  createRecognizeResumeImportMethod = createRecognizeAiResumeImportMethod,
  streamResumeImportJobMethod = streamAiResumeImportJob,
  onRecognized,
  elapsedTickMs = 1000,
}: ResumeImportPanelProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [job, setJob] = useState<AiResumeImportJob | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [displayElapsedMs, setDisplayElapsedMs] = useState(0)
  const [refreshingJob, setRefreshingJob] = useState(false)
  const [lastHeartbeatAt, setLastHeartbeatAt] = useState<string | null>(null)
  const [progressHint, setProgressHint] = useState<string | null>(null)
  const [recoveringJobId, setRecoveringJobId] = useState<string | null>(null)
  const [restorableJobId, setRestorableJobId] = useState<string | null>(null)
  const [manualExpandedStepKeys, setManualExpandedStepKeys] = useState<Set<string>>(
    new Set(),
  )
  const completedJobIdRef = useRef<string | null>(null)
  const restoredJobIdRef = useRef<string | null>(null)
  const { loading: recognizing, send: triggerRecognize } = useRequest(
    (file: File) =>
      createRecognizeResumeImportMethod({
        apiBaseUrl,
        accessToken,
        file,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const { send: fetchJob } = useRequest(
    (jobId: string) =>
      createFetchResumeImportJobMethod({
        apiBaseUrl,
        accessToken,
        jobId,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const fetchJobRef = useRef(fetchJob)
  const streamJobRef = useRef(streamResumeImportJobMethod)

  function handleJobUpdate(nextJob: AiResumeImportJob) {
    setJob(nextJob)

    if (nextJob.status === 'running') {
      writeActiveResumeImportJobId(nextJob.jobId)
      setRestorableJobId(null)
    } else {
      clearActiveResumeImportJobId(nextJob.jobId)
      setRestorableJobId(null)
      setDisplayElapsedMs((current) =>
        resolveFiniteElapsedMs(nextJob.elapsedMs, current),
      )
      setLastHeartbeatAt(null)
      setProgressHint(null)
    }

    if (nextJob.status === 'completed' && nextJob.resultId) {
      if (completedJobIdRef.current === nextJob.jobId) {
        return
      }

      completedJobIdRef.current = nextJob.jobId
      onRecognized?.(nextJob)
      router.push(`/dashboard/ai/resume-import/results/${nextJob.resultId}`)
    }
  }
  const handleJobUpdateRef = useRef(handleJobUpdate)

  useEffect(() => {
    fetchJobRef.current = fetchJob
    streamJobRef.current = streamResumeImportJobMethod
    handleJobUpdateRef.current = handleJobUpdate
  })

  async function recoverActiveJob(activeJobId: string) {
    setRecoveringJobId(activeJobId)
    setErrorMessage(null)

    try {
      const nextJob = await fetchJobRef.current(activeJobId)

      setRestorableJobId(null)
      handleJobUpdateRef.current(nextJob)
    } catch (error: unknown) {
      const message = normalizeClientError(error)
      const shouldForgetJob = /404|not found|不存在|未找到/i.test(message)

      if (shouldForgetJob) {
        clearActiveResumeImportJobId(activeJobId)
        setRestorableJobId(null)
      } else {
        setRestorableJobId(activeJobId)
      }

      if (message) {
        setErrorMessage(`未能恢复上一次识别任务：${message}`)
      }
    } finally {
      setRecoveringJobId(null)
    }
  }

  useEffect(() => {
    if (job) {
      return
    }

    const activeJobId = readActiveResumeImportJobId()

    if (!activeJobId || restoredJobIdRef.current === activeJobId) {
      return
    }

    restoredJobIdRef.current = activeJobId
    void recoverActiveJob(activeJobId)
  }, [accessToken, apiBaseUrl, job])

  async function refreshJobStatus() {
    if (!job) {
      return
    }

    setRefreshingJob(true)
    setErrorMessage(null)

    try {
      const nextJob = await fetchJobRef.current(job.jobId)
      handleJobUpdate(nextJob)
    } catch (error) {
      setErrorMessage(normalizeClientError(error))
    } finally {
      setRefreshingJob(false)
    }
  }

  useEffect(() => {
    if (!job) {
      setDisplayElapsedMs(0)
      return
    }

    if (job.status !== 'running') {
      setDisplayElapsedMs((current) => resolveFiniteElapsedMs(job.elapsedMs, current))
      return
    }

    const createdAtTime = resolveTimestampMs(job.createdAt)
    const fallbackElapsedMs = resolveFiniteElapsedMs(job.elapsedMs)

    if (createdAtTime === null) {
      setDisplayElapsedMs(fallbackElapsedMs)
      return
    }

    const updateElapsed = () => {
      setDisplayElapsedMs(Math.max(0, Date.now() - createdAtTime))
    }

    updateElapsed()
    const intervalId = window.setInterval(updateElapsed, elapsedTickMs)

    return () => window.clearInterval(intervalId)
  }, [elapsedTickMs, job])

  useEffect(() => {
    if (!job || job.status !== 'running') {
      return
    }

    const abortController = new AbortController()

    void streamJobRef
      .current(
        {
          apiBaseUrl,
          accessToken,
          jobId: job.jobId,
          signal: abortController.signal,
        },
        {
          onSnapshot: handleJobUpdateRef.current,
          onCompleted: handleJobUpdateRef.current,
          onFailed: handleJobUpdateRef.current,
          onHeartbeat: (heartbeat) => {
            setLastHeartbeatAt(heartbeat.timestamp)
          },
          onProgressHint: (hint) => {
            setProgressHint(hint.message)
          },
        },
      )
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return
        }

        const message = normalizeClientError(error)

        if (message) {
          setErrorMessage(`实时连接中断，可手动刷新状态：${message}`)
        }
      })

    return () => abortController.abort()
  }, [accessToken, apiBaseUrl, job?.jobId, job?.status])

  const expandedStepKeys = useMemo(() => {
    const autoExpandedKeys = resolveAutoExpandedStepKeys(job)
    const nextKeys = new Set<string>(autoExpandedKeys)

    for (const key of manualExpandedStepKeys) {
      const step = resolveJobSteps(job).find((item) => item.stage === key)

      if (step && step.status !== 'pending') {
        nextKeys.add(key)
      }
    }

    return nextKeys
  }, [job, manualExpandedStepKeys])
  const jobSteps = resolveJobSteps(job)

  if (!canUpload) {
    return (
      <section className="stack pt-4">
        <div className="readonly-box">
          <strong>当前角色只读</strong>
          <span>只有管理员可上传简历并生成候选草稿。</span>
          <span>viewer 可以查看缓存结果，但不能触发新的 AI 识别或写回草稿。</span>
        </div>
      </section>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!selectedFile) {
      return
    }

    setErrorMessage(null)
    setJob(null)
    setLastHeartbeatAt(null)
    setProgressHint(null)
    setRestorableJobId(null)
    setManualExpandedStepKeys(new Set())
    completedJobIdRef.current = null

    try {
      const nextJob = await triggerRecognize(selectedFile)

      writeActiveResumeImportJobId(nextJob.jobId)
      handleJobUpdate(nextJob)
    } catch (error) {
      setJob(null)
      setErrorMessage(normalizeClientError(error))
    }
  }

  return (
    <section className="stack pt-4">
      <Form className="stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>选择中文 md/txt 简历</span>
          <Input
            accept=".md,.txt"
            aria-label="选择简历导入文件"
            fullWidth
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              setSelectedFile(file)
              setErrorMessage(null)
              setLastHeartbeatAt(null)
              setProgressHint(null)
              setManualExpandedStepKeys(new Set())
              if (job?.status !== 'running') {
                setJob(null)
                setRestorableJobId(null)
                clearActiveResumeImportJobId()
                completedJobIdRef.current = null
                restoredJobIdRef.current = null
              }
            }}
            type="file"
            variant="secondary"
          />
        </label>

        <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          边界规则：仅 md/txt，最大 1MB，提取文本需在 500 到 50000 字符之间。规则层会先快速治理输入，长耗时只发生在候选草稿生成阶段。
        </div>

        {selectedFile ? (
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>待识别文件</strong>
            <span>
              {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </span>
          </div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        {!job && recoveringJobId ? (
          <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
            正在恢复上一次简历识别任务：{recoveringJobId}
          </div>
        ) : null}

        {!job && restorableJobId && !recoveringJobId ? (
          <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
            检测到上一次未结束的识别任务：{restorableJobId}。如果服务端仍保留该
            Job，可以继续查询并恢复实时进度。
            <Button
              className="mt-3"
              onPress={() => void recoverActiveJob(restorableJobId)}
              size="sm"
              type="button"
              variant="outline">
              继续查询上一次任务
            </Button>
          </div>
        ) : null}

        <div className="dashboard-entry-actions">
          <Button
            className={adminPrimaryButtonClass}
            isDisabled={!selectedFile || recognizing || job?.status === 'running'}
            size="md"
            type="submit"
            variant="primary">
            {recognizing ? '正在创建识别任务...' : '上传并启动识别'}
          </Button>
          {job?.status === 'failed' ? (
            <Button size="md" type="submit" variant="outline">
              重试识别
            </Button>
          ) : null}
        </div>
      </Form>

      {job ? (
        <div className="stack" data-testid="resume-import-job-panel">
          {job.status === 'running' && job.currentStage === 'ai_generating' ? (
            <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
              模型正在通过单次调用生成候选草稿和输入治理报告，通常需要 3-5
              分钟。你可以保持页面打开，完成后会自动跳转；
              {formatHeartbeatDistance(lastHeartbeatAt)}。
              {progressHint ? ` ${progressHint}。` : ''}
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="status-box bg-white dark:bg-zinc-900">
              <strong>任务状态</strong>
              <span>{statusLabel(job.status)}</span>
            </div>
            <div className="status-box bg-white dark:bg-zinc-900">
              <strong>当前阶段</strong>
              <span>
                {jobSteps.find((step) => step.stage === job.currentStage)?.label ??
                  job.currentStage}
              </span>
            </div>
            <div className="status-box bg-white dark:bg-zinc-900">
              <strong>已耗时</strong>
              <span>{formatElapsed(displayElapsedMs)}</span>
            </div>
          </div>

          <div className="dashboard-entry-actions">
            <Button
              isDisabled={refreshingJob}
              onPress={() => void refreshJobStatus()}
              size="sm"
              type="button"
              variant="outline">
              {refreshingJob ? '正在刷新...' : '手动刷新状态'}
            </Button>
          </div>

          <Accordion
            allowsMultipleExpanded
            className="grid gap-1"
            expandedKeys={expandedStepKeys}
            onExpandedChange={(keys) => {
              setManualExpandedStepKeys(new Set(Array.from(keys as Iterable<string>)))
            }}
            data-testid="resume-import-job-steps">
            {jobSteps.map((step) => (
              <Accordion.Item
                className="border-b border-zinc-200/75 data-[disabled=true]:opacity-55 dark:border-zinc-800"
                id={step.stage}
                isDisabled={step.status === 'pending'}
                key={step.stage}>
                <Accordion.Heading>
                  <Accordion.Trigger className="grid w-full grid-cols-[1rem_minmax(0,1fr)_1rem] items-center gap-3 py-3 text-left">
                    <span className="relative flex size-3 items-center justify-center">
                      {step.status === 'running' ? (
                        <span className="absolute inline-flex size-3 animate-ping rounded-full bg-blue-400 opacity-35" />
                      ) : null}
                      <span
                        className={`relative inline-flex size-2.5 rounded-full ${statusDotClass(
                          step.status,
                        )} ${step.status === 'running' ? 'animate-pulse' : ''}`}
                      />
                    </span>
                    <span className="grid min-w-0 gap-1">
                      <span className="font-semibold text-zinc-950 dark:text-white">
                        {step.label}
                      </span>
                      <span className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                        {stepStatusLabel(step.status)}
                        {step.summary ? ` · ${step.summary}` : ''}
                      </span>
                    </span>
                    <Accordion.Indicator className="size-4 text-zinc-400" />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="grid grid-cols-[1rem_minmax(0,1fr)_1rem] gap-3 pb-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="col-start-2 grid gap-2">
                      <span>{stepStatusLabel(step.status)}</span>
                      {step.status === 'running' ? (
                        <span className="text-blue-600 dark:text-blue-300">
                          {runningStepHint(step.stage)}
                        </span>
                      ) : null}
                      {step.summary ? <span>{step.summary}</span> : null}
                      {step.details && step.details.length > 0 ? (
                        <ul className="grid gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                          {step.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>
                      ) : null}
                      {step.message ? (
                        <span className="error-text">{step.message}</span>
                      ) : null}
                    </div>
                  </Accordion.Body>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>

          {jobSteps.length === 0 ? (
            <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
              任务已创建，正在等待服务端返回阶段时间线。你可以保持页面打开，或稍后手动刷新状态。
            </div>
          ) : null}

          {job.status === 'failed' && job.error ? (
            <div className="error-text">
              接口返回：{job.error.message}
              {job.error.traceId ? `（traceId: ${job.error.traceId}）` : ''}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

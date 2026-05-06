'use client'

import { useRequest } from 'alova/client'
import { Accordion, Button, Form, Input } from '@heroui/react'
import { formatFileSize } from '@my-resume/utils'
import { useEffect, useMemo, useRef, useState } from 'react'

import { adminPrimaryButtonClass } from '@core/button-styles'
import {
  AiTaskStatusChip,
  formatAiTaskElapsed,
  useAiTaskProgress,
} from '../../../_shared/components/ai-task-progress'

import {
  createRecognizeAiResumeImportMethod,
} from '../services/ai-workbench-api'
import type { AiResumeImportJob, AiResumeImportJobStep } from '../types/ai-workbench.types'

interface ResumeImportPanelProps {
  /** API 服务根地址。 */
  apiBaseUrl: string
  /** 当前管理员访问令牌，用于调用受保护的 AI 接口。 */
  accessToken: string
  /** 当前角色是否允许上传并触发简历导入识别。 */
  canUpload: boolean
  /** 测试注入点：构造启动识别任务的 API method。 */
  createRecognizeResumeImportMethod?: typeof createRecognizeAiResumeImportMethod
  /** 识别完成后的回调，通常用于记录或跳转前的扩展。 */
  onRecognized?: (job: AiResumeImportJob) => void
  /** 兼容旧测试参数：SSE 版不再自动轮询。 */
  initialPollIntervalMs?: number
  /** 兼容旧测试参数：SSE 版不再自动轮询。 */
  slowPollAfterMs?: number
  /** 兼容旧测试参数：SSE 版不再自动轮询。 */
  slowPollIntervalMs?: number
}

function formatHeartbeatDistance(timestamp: string | null): string {
  if (!timestamp) {
    return '正在建立实时连接'
  }

  return `实时连接正常，最近心跳 ${formatAiTaskElapsed(
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

function stepStatusLabel(status: AiResumeImportJob['steps'][number]['status']): string {
  const labels: Record<AiResumeImportJob['steps'][number]['status'], string> = {
    pending: '等待中',
    running: '进行中',
    completed: '已完成',
    failed: '失败',
  }

  return labels[status]
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

function resolveJobSteps(job: AiResumeImportJob | null): AiResumeImportJob['steps'] {
  return Array.isArray(job?.steps) ? job.steps : []
}

const PERCEIVED_STEP_INTERVAL_MS = 5_000
const PERCEIVED_STEP_DURATION_MS = 30_000

export function buildPerceivedResumeImportSteps(
  job: AiResumeImportJob | null,
  elapsedMs: number,
): AiResumeImportJobStep[] {
  const steps = resolveJobSteps(job)

  if (!job || job.status !== 'running' || job.currentStage !== 'ai_generating') {
    return steps
  }

  if (elapsedMs >= PERCEIVED_STEP_DURATION_MS) {
    return steps
  }

  const aiGeneratingIndex = steps.findIndex((step) => step.stage === 'ai_generating')

  if (aiGeneratingIndex <= 0) {
    return steps
  }

  const visibleCompletedCount = Math.min(
    aiGeneratingIndex,
    Math.max(1, Math.floor(elapsedMs / PERCEIVED_STEP_INTERVAL_MS) + 1),
  )

  return steps.map((step, index) => {
    if (index < visibleCompletedCount || step.status === 'failed') {
      return step
    }

    return {
      stage: step.stage,
      label: step.label,
      status: 'pending',
    }
  })
}

export function ResumeImportPanel({
  apiBaseUrl,
  accessToken,
  canUpload,
  createRecognizeResumeImportMethod = createRecognizeAiResumeImportMethod,
  onRecognized,
}: ResumeImportPanelProps) {
  const {
    resumeImportJob: job,
    displayElapsedMs,
    lastHeartbeatAt,
    progressHint,
    connectionError,
    restoringJobId,
    registerResumeImportJob,
    refreshResumeImportJob,
  } = useAiTaskProgress()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [refreshingJob, setRefreshingJob] = useState(false)
  const [manualExpandedStepKeys, setManualExpandedStepKeys] = useState<Set<string>>(
    new Set(),
  )
  const completedJobIdRef = useRef<string | null>(null)
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

  async function refreshJobStatus() {
    if (!job) {
      return
    }

    setRefreshingJob(true)
    setErrorMessage(null)

    try {
      await refreshResumeImportJob()
    } catch (error) {
      setErrorMessage(normalizeClientError(error))
    } finally {
      setRefreshingJob(false)
    }
  }

  const jobSteps = buildPerceivedResumeImportSteps(job, displayElapsedMs)
  const expandedStepKeys = useMemo(() => {
    const autoExpandedKeys = new Set(
      jobSteps
        .filter((step) => step.status === 'running' || step.status === 'failed')
        .map((step) => step.stage),
    )
    const nextKeys = new Set<string>(autoExpandedKeys)

    for (const key of manualExpandedStepKeys) {
      const step = jobSteps.find((item) => item.stage === key)

      if (step && step.status !== 'pending') {
        nextKeys.add(key)
      }
    }

    return nextKeys
  }, [jobSteps, manualExpandedStepKeys])
  const displayCurrentStep =
    jobSteps.find((step) => step.status === 'running') ??
    [...jobSteps].reverse().find((step) => step.status !== 'pending') ??
    resolveJobSteps(job).find((step) => step.stage === job?.currentStage)

  useEffect(() => {
    if (job?.status !== 'completed') {
      return
    }

    if (completedJobIdRef.current === job.jobId) {
      return
    }

    completedJobIdRef.current = job.jobId
    onRecognized?.(job)
  }, [job, onRecognized])

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
    setManualExpandedStepKeys(new Set())
    completedJobIdRef.current = null

    try {
      const nextJob = await triggerRecognize(selectedFile)

      registerResumeImportJob(nextJob)
    } catch (error) {
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
              setManualExpandedStepKeys(new Set())
              completedJobIdRef.current = null
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

        {!job && restoringJobId ? (
          <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
            正在恢复上一次简历识别任务：{restoringJobId}
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
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between gap-3">
                <strong className="text-sm text-zinc-500 dark:text-zinc-400">
                  任务状态
                </strong>
                <AiTaskStatusChip status={job.status} />
              </div>
              <p className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                {job.jobId}
              </p>
            </div>
            <div className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <strong className="text-sm text-zinc-500 dark:text-zinc-400">
                当前阶段
              </strong>
              <p className="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">
                {displayCurrentStep?.label ?? job.currentStage}
              </p>
              {progressHint ? (
                <p className="mt-1 truncate text-sm text-blue-600 dark:text-blue-300">
                  {progressHint}
                </p>
              ) : null}
            </div>
            <div className="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <strong className="text-sm text-zinc-500 dark:text-zinc-400">
                已耗时
              </strong>
              <p
                className={`mt-2 text-3xl font-semibold tabular-nums ${
                  job.status === 'failed'
                    ? 'text-red-600 dark:text-red-300'
                    : job.status === 'completed'
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-blue-600 dark:text-blue-300'
                }`}>
                {formatAiTaskElapsed(displayElapsedMs)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                {formatHeartbeatDistance(lastHeartbeatAt)}
              </p>
            </div>
          </div>

          {connectionError ? <p className="error-text">{connectionError}</p> : null}

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
                  <Accordion.Trigger className="grid w-full grid-cols-[minmax(0,1fr)_auto_1rem] items-center gap-3 py-3 text-left">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="truncate font-semibold text-zinc-950 dark:text-white">
                        {step.label}
                      </span>
                      {step.summary ? (
                        <span className="hidden min-w-0 truncate text-sm text-zinc-500 dark:text-zinc-400 md:inline">
                          {step.summary}
                        </span>
                      ) : null}
                    </span>
                    <AiTaskStatusChip status={step.status} />
                    <Accordion.Indicator className="size-4 text-zinc-400" />
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel>
                  <Accordion.Body className="pb-3 text-sm text-zinc-600 dark:text-zinc-300">
                    <div className="grid gap-2">
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

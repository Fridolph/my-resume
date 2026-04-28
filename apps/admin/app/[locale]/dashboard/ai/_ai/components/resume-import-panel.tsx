'use client'

import { useRequest } from 'alova/client'
import { Button, Form, Input } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { adminPrimaryButtonClass } from '@core/button-styles'

import {
  createFetchAiResumeImportJobMethod,
  createRecognizeAiResumeImportMethod,
} from '../services/ai-workbench-api'
import type { AiResumeImportJob } from '../types/ai-workbench.types'

interface ResumeImportPanelProps {
  apiBaseUrl: string
  accessToken: string
  canUpload: boolean
  createFetchResumeImportJobMethod?: typeof createFetchAiResumeImportJobMethod
  createRecognizeResumeImportMethod?: typeof createRecognizeAiResumeImportMethod
  onRecognized?: (job: AiResumeImportJob) => void
  pollIntervalMs?: number
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  return `${(size / 1024).toFixed(1)} KB`
}

function formatElapsed(ms: number): string {
  if (ms < 1000) {
    return `${ms} ms`
  }

  return `${(ms / 1000).toFixed(1)} 秒`
}

function normalizeClientError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''

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

export function ResumeImportPanel({
  apiBaseUrl,
  accessToken,
  canUpload,
  createFetchResumeImportJobMethod = createFetchAiResumeImportJobMethod,
  createRecognizeResumeImportMethod = createRecognizeAiResumeImportMethod,
  onRecognized,
  pollIntervalMs = 1200,
}: ResumeImportPanelProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [job, setJob] = useState<AiResumeImportJob | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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

  useEffect(() => {
    if (!job || job.status !== 'running') {
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      void fetchJob(job.jobId)
        .then((nextJob: AiResumeImportJob) => {
          if (cancelled) {
            return
          }

          setJob(nextJob)

          if (nextJob.status === 'completed' && nextJob.resultId) {
            if (completedJobIdRef.current === nextJob.jobId) {
              return
            }

            completedJobIdRef.current = nextJob.jobId
            onRecognized?.(nextJob)
            router.push(`/dashboard/ai/resume-import/results/${nextJob.resultId}`)
          }
        })
        .catch((error: unknown) => {
          if (cancelled) {
            return
          }

          setErrorMessage(normalizeClientError(error))
        })
    }, pollIntervalMs)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [fetchJob, job, onRecognized, pollIntervalMs, router])

  if (!canUpload) {
    return (
      <section className="card stack">
        <div>
          <p className="eyebrow">简历导入识别</p>
          <h2>当前角色只读</h2>
          <p className="muted">只有管理员可上传简历并生成候选草稿。</p>
        </div>
        <div className="readonly-box">
          viewer 可以查看缓存结果，但不能触发新的 AI 识别或写回草稿。
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
    completedJobIdRef.current = null

    try {
      const nextJob = await triggerRecognize(selectedFile)

      setJob(nextJob)
    } catch (error) {
      setJob(null)
      setErrorMessage(normalizeClientError(error))
    }
  }

  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">简历导入识别</p>
        <h2>上传自己的中文简历</h2>
        <p className="muted">
          第一版只支持 Markdown /
          TXT：先启动识别任务，再通过阶段时间线观察进度，完成后进入 diff 看台确认。
        </p>
      </div>

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
              setJob(null)
              completedJobIdRef.current = null
            }}
            type="file"
            variant="secondary"
          />
        </label>

        <div className="dashboard-inline-note">
          边界规则：仅 md/txt，最大 1MB，提取文本需在 500 到 50000 字符之间。
        </div>

        {selectedFile ? (
          <div className="status-box">
            <strong>待识别文件</strong>
            <span>
              {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </span>
          </div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

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
            <div className="status-box">
              <strong>任务状态</strong>
              <span>{statusLabel(job.status)}</span>
            </div>
            <div className="status-box">
              <strong>当前阶段</strong>
              <span>
                {job.steps.find((step) => step.stage === job.currentStage)?.label ??
                  job.currentStage}
              </span>
            </div>
            <div className="status-box">
              <strong>已耗时</strong>
              <span>{formatElapsed(job.elapsedMs)}</span>
            </div>
          </div>

          <ol className="grid gap-2" data-testid="resume-import-job-steps">
            {job.steps.map((step) => (
              <li className="status-box" key={step.stage}>
                <strong>{step.label}</strong>
                <span>{step.status}</span>
                {step.message ? <span className="error-text">{step.message}</span> : null}
              </li>
            ))}
          </ol>

          {job.status === 'failed' && job.error ? (
            <div className="error-text">
              接口返回：{job.error.message}
              {job.error.traceId ? `（traceId: ${job.error.traceId}）` : ''}
            </div>
          ) : null}

          {job.status === 'completed' && job.resultId ? (
            <div className="dashboard-entry-actions">
              <Button
                className={adminPrimaryButtonClass}
                onPress={() =>
                  router.push(`/dashboard/ai/resume-import/results/${job.resultId}`)
                }
                size="md"
                variant="primary">
                查看结果看台
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

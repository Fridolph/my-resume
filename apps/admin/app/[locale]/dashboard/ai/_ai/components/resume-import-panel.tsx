'use client'

import { useRequest } from 'alova/client'
import { Button, Form, Input } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { adminPrimaryButtonClass } from '@core/button-styles'

import { createRecognizeAiResumeImportMethod } from '../services/ai-workbench-api'
import type { AiResumeImportResult } from '../types/ai-workbench.types'

interface ResumeImportPanelProps {
  apiBaseUrl: string
  accessToken: string
  canUpload: boolean
  createRecognizeResumeImportMethod?: typeof createRecognizeAiResumeImportMethod
  onRecognized?: (result: AiResumeImportResult) => void
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  return `${(size / 1024).toFixed(1)} KB`
}

export function ResumeImportPanel({
  apiBaseUrl,
  accessToken,
  canUpload,
  createRecognizeResumeImportMethod = createRecognizeAiResumeImportMethod,
  onRecognized,
}: ResumeImportPanelProps) {
  const router = useRouter()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<AiResumeImportResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
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

    try {
      const nextResult = await triggerRecognize(selectedFile)

      setResult(nextResult)
      onRecognized?.(nextResult)
      router.push(`/dashboard/ai/resume-import/results/${nextResult.resultId}`)
    } catch (error) {
      setResult(null)
      setErrorMessage(
        error instanceof Error ? error.message : '简历导入识别失败，请稍后重试',
      )
    }
  }

  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">简历导入识别</p>
        <h2>上传自己的中文简历</h2>
        <p className="muted">
          第一版只支持 Markdown / TXT：先识别为候选草稿，再进入 diff 看台确认，不会直接覆盖发布态。
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
              setResult(null)
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
            isDisabled={!selectedFile || recognizing}
            size="md"
            type="submit"
            variant="primary">
            {recognizing ? '正在识别候选草稿...' : '上传并识别简历'}
          </Button>
        </div>
      </Form>

      {result ? (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="status-box">
            <strong>识别模块</strong>
            <span>{result.changedModules.length} 个模块存在差异</span>
          </div>
          <div className="status-box">
            <strong>项目 / 经历</strong>
            <span>
              {result.moduleStats.projects} / {result.moduleStats.experiences}
            </span>
          </div>
          <div className="status-box">
            <strong>提醒</strong>
            <span>{result.warnings.length} 条</span>
          </div>
        </div>
      ) : null}
    </section>
  )
}

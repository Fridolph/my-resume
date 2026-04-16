'use client'

import { useRequest } from 'alova/client'
import { Button, Form, Input, TextArea } from '@heroui/react'

import { adminPrimaryButtonClass } from '@core/button-styles'
import { useState } from 'react'

import { createExtractTextFromFileMethod } from '../services/ai-file-api'
import { FileExtractionResult } from '../types/ai-file.types'

interface AiFileExtractionPanelProps {
  apiBaseUrl: string
  accessToken: string
  canUpload: boolean
  createExtractFileTextMethod?: typeof createExtractTextFromFileMethod
  onExtractedText?: (result: FileExtractionResult) => void
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  return `${(size / 1024).toFixed(1)} KB`
}

export function AiFileExtractionPanel({
  apiBaseUrl,
  accessToken,
  canUpload,
  createExtractFileTextMethod = createExtractTextFromFileMethod,
  onExtractedText,
}: AiFileExtractionPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<FileExtractionResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { loading: extracting, send: triggerExtract } = useRequest(
    (file: File) =>
      createExtractFileTextMethod({
        apiBaseUrl,
        accessToken,
        file,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const pending = extracting

  if (!canUpload) {
    return (
      <section className="card stack">
        <div>
          <p className="eyebrow">文件提取</p>
          <h2>当前角色只读</h2>
          <p className="muted">只有管理员可上传文件并触发文本提取。</p>
        </div>
        <div className="readonly-box">
          viewer 当前只保留缓存结果与预设体验，文件上传入口会在管理员链路中继续推进。
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
      const nextResult = await triggerExtract(selectedFile)

      setResult(nextResult)
      onExtractedText?.(nextResult)
    } catch (error) {
      setResult(null)
      setErrorMessage(error instanceof Error ? error.message : '文件提取失败，请稍后重试')
    }
  }

  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">文件提取</p>
        <h2>上传并预览提取结果</h2>
        <p className="muted">
          当前先接通单文件上传与文本预览，为后续真实分析闭环提供稳定输入。
        </p>
      </div>

      <Form className="stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>选择文件</span>
          <Input
            accept=".txt,.md,.pdf,.docx"
            aria-label="选择文件"
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
          当前支持：TXT、Markdown、PDF、DOCX。结果仅做预览，不会自动保存成附件历史。
        </div>

        {selectedFile ? (
          <div className="status-box">
            <strong>待提取文件</strong>
            <span>
              {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </span>
          </div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <div className="dashboard-entry-actions">
          <Button
            className={adminPrimaryButtonClass}
            isDisabled={!selectedFile || pending}
            size="md"
            type="submit"
            variant="primary">
            {pending ? '正在提取文本...' : '开始提取文本'}
          </Button>
        </div>
      </Form>

      {result ? (
        <div className="preview-stack">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="status-box">
              <strong>文件类型</strong>
              <span>{result.fileType}</span>
            </div>
            <div className="status-box">
              <strong>字符数</strong>
              <span>{result.charCount}</span>
            </div>
          </div>

          <label className="field">
            <span>提取结果预览</span>
            <TextArea
              className="min-h-[17.5rem] font-mono leading-6"
              fullWidth
              readOnly
              value={result.text}
              variant="secondary"
            />
          </label>
        </div>
      ) : null}
    </section>
  )
}

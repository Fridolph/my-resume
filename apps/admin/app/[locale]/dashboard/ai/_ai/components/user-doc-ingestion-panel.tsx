'use client'

import { useRequest } from 'alova/client'
import { Button, Form, Input } from '@heroui/react'
import { useState } from 'react'

import { formatFileSize } from '@my-resume/utils'
import { adminPrimaryButtonClass } from '@core/button-styles'

import { createIngestRagUserDocMethod } from '../services/ai-file-api'
import type {
  UserDocChunkingProfile,
  UserDocIngestResult,
  UserDocIngestScope,
} from '../types/ai-file.types'
import {
  USER_DOC_MAX_CHUNK_OVERLAP,
  USER_DOC_MAX_CHUNK_SIZE,
  USER_DOC_MIN_CHUNK_OVERLAP,
  USER_DOC_MIN_CHUNK_SIZE,
} from '../types/ai-file.types'

const USER_DOC_CHUNKING_PRESETS: Record<
  UserDocChunkingProfile,
  { chunkSize: number; chunkOverlap: number }
> = {
  balanced: {
    chunkSize: 500,
    chunkOverlap: 50,
  },
  contextual: {
    chunkSize: 1000,
    chunkOverlap: 100,
  },
}

interface AiUserDocIngestionPanelProps {
  /** Server API 根地址，用于构造上传入库请求。 */
  apiBaseUrl: string
  /** 当前管理员访问令牌；viewer 角色不能触发入库。 */
  accessToken: string
  /** 当前角色是否允许上传并写入 user_docs 检索态。 */
  canUpload: boolean
  /** 测试注入点：替换默认 user_docs 入库 API method。 */
  createIngestUserDocMethod?: typeof createIngestRagUserDocMethod
  /** 入库成功后的回调，通常用于刷新父级看台。 */
  onIngested?: (result: UserDocIngestResult) => void
}

export function AiUserDocIngestionPanel({
  apiBaseUrl,
  accessToken,
  canUpload,
  createIngestUserDocMethod = createIngestRagUserDocMethod,
  onIngested,
}: AiUserDocIngestionPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scope, setScope] = useState<UserDocIngestScope>('draft')
  const [chunkingProfile, setChunkingProfile] =
    useState<UserDocChunkingProfile>('balanced')
  const [chunkSizeInput, setChunkSizeInput] = useState('500')
  const [chunkOverlapInput, setChunkOverlapInput] = useState('50')
  const [result, setResult] = useState<UserDocIngestResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { loading: ingesting, send: triggerIngest } = useRequest(
    (payload: {
      file: File
      scope: UserDocIngestScope
      chunkingProfile: UserDocChunkingProfile
      chunkSize: number
      chunkOverlap: number
    }) =>
      createIngestUserDocMethod({
        apiBaseUrl,
        accessToken,
        file: payload.file,
        scope: payload.scope,
        chunkingProfile: payload.chunkingProfile,
        chunkSize: payload.chunkSize,
        chunkOverlap: payload.chunkOverlap,
      }),
    {
      force: true,
      immediate: false,
    },
  )

  function validateChunkingConfig(): { chunkSize: number; chunkOverlap: number } | null {
    const chunkSize = Number(chunkSizeInput)
    const chunkOverlap = Number(chunkOverlapInput)

    if (!Number.isInteger(chunkSize)) {
      setErrorMessage('切片大小必须是整数')
      return null
    }

    if (chunkSize < USER_DOC_MIN_CHUNK_SIZE || chunkSize > USER_DOC_MAX_CHUNK_SIZE) {
      setErrorMessage(
        `切片大小建议在 ${USER_DOC_MIN_CHUNK_SIZE}-${USER_DOC_MAX_CHUNK_SIZE} 之间`,
      )
      return null
    }

    if (!Number.isInteger(chunkOverlap)) {
      setErrorMessage('重叠字符数必须是整数')
      return null
    }

    if (
      chunkOverlap < USER_DOC_MIN_CHUNK_OVERLAP ||
      chunkOverlap > USER_DOC_MAX_CHUNK_OVERLAP
    ) {
      setErrorMessage(
        `重叠字符数建议在 ${USER_DOC_MIN_CHUNK_OVERLAP}-${USER_DOC_MAX_CHUNK_OVERLAP} 之间`,
      )
      return null
    }

    if (chunkOverlap >= chunkSize) {
      setErrorMessage('重叠字符数必须小于切片大小')
      return null
    }

    return {
      chunkSize,
      chunkOverlap,
    }
  }

  if (!canUpload) {
    return (
      <section className="stack pt-4">
        <div className="readonly-box">
          <strong>当前角色只读</strong>
          <span>只有管理员可上传 user_docs 并写入 RAG 检索态。</span>
          <span>viewer 当前只允许读取缓存与预设体验，不允许触发 user_docs 入库。</span>
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
    const chunkingConfig = validateChunkingConfig()

    if (!chunkingConfig) {
      return
    }

    try {
      const nextResult = await triggerIngest({
        file: selectedFile,
        scope,
        chunkingProfile,
        chunkSize: chunkingConfig.chunkSize,
        chunkOverlap: chunkingConfig.chunkOverlap,
      })

      setResult(nextResult)
      onIngested?.(nextResult)
    } catch (error) {
      setResult(null)
      setErrorMessage(error instanceof Error ? error.message : '资料入库失败，请稍后重试')
    }
  }

  return (
    <section className="stack pt-4">
      <Form className="stack" onSubmit={(event) => void handleSubmit(event)}>
        <label className="field">
          <span>选择文件</span>
          <Input
            accept=".txt,.md,.pdf,.docx"
            aria-label="选择入库文件"
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

        <label className="field">
          <span>入库作用域</span>
          <select
            aria-label="入库作用域"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-zinc-600"
            onChange={(event) => setScope(event.target.value as UserDocIngestScope)}
            value={scope}>
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </label>

        <label className="field">
          <span>切片策略</span>
          <select
            aria-label="切片策略"
            className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-zinc-600"
            onChange={(event) => {
              const nextProfile = event.target.value as UserDocChunkingProfile
              const preset = USER_DOC_CHUNKING_PRESETS[nextProfile]

              setChunkingProfile(nextProfile)
              setChunkSizeInput(String(preset.chunkSize))
              setChunkOverlapInput(String(preset.chunkOverlap))
              setErrorMessage(null)
            }}
            value={chunkingProfile}>
            <option value="balanced">balanced · 默认 500/50</option>
            <option value="contextual">contextual · 长上下文 1000/100</option>
          </select>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="field">
            <span>切片大小</span>
            <Input
              aria-label="切片大小"
              fullWidth
              max={USER_DOC_MAX_CHUNK_SIZE}
              min={USER_DOC_MIN_CHUNK_SIZE}
              onChange={(event) => {
                setChunkSizeInput(event.target.value)
                setErrorMessage(null)
              }}
              step={1}
              type="number"
              value={chunkSizeInput}
              variant="secondary"
            />
          </label>

          <label className="field">
            <span>重叠字符数</span>
            <Input
              aria-label="重叠字符数"
              fullWidth
              max={USER_DOC_MAX_CHUNK_OVERLAP}
              min={USER_DOC_MIN_CHUNK_OVERLAP}
              onChange={(event) => {
                setChunkOverlapInput(event.target.value)
                setErrorMessage(null)
              }}
              step={1}
              type="number"
              value={chunkOverlapInput}
              variant="secondary"
            />
          </label>
        </div>

        <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          建议 chunkSize {USER_DOC_MIN_CHUNK_SIZE}-{USER_DOC_MAX_CHUNK_SIZE}，
          chunkOverlap {USER_DOC_MIN_CHUNK_OVERLAP}-{USER_DOC_MAX_CHUNK_OVERLAP}，
          且 overlap 小于 chunkSize；常用配置 500/50 或 1000/100。
        </div>

        {selectedFile ? (
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>待入库文件</strong>
            <span>
              {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </span>
            <span>scope: {scope}</span>
            <span>
              chunking: {chunkingProfile} · {chunkSizeInput}/{chunkOverlapInput}
            </span>
          </div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <div className="dashboard-entry-actions">
          <Button
            className={adminPrimaryButtonClass}
            isDisabled={!selectedFile || ingesting}
            size="md"
            type="submit"
            variant="primary">
            {ingesting ? '正在写入检索态...' : '上传并写入 user_docs'}
          </Button>
        </div>
      </Form>

      {result ? (
        <div className="grid gap-3 md:grid-cols-3">
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>作用域</strong>
            <span>{result.sourceScope}</span>
          </div>
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>切块数量</strong>
            <span>{result.chunkCount}</span>
          </div>
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>文件类型</strong>
            <span>{result.fileType}</span>
          </div>
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>来源版本</strong>
            <span>{result.sourceVersion}</span>
          </div>
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>切片策略</strong>
            <span>{result.chunkingProfile}</span>
          </div>
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>切片配置</strong>
            <span>
              {result.chunkSize}/{result.chunkOverlap}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  )
}

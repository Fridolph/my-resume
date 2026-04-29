'use client'

import { useRequest } from 'alova/client'
import { Button, Form, Input } from '@heroui/react'
import { useState } from 'react'

import { formatFileSize } from '@my-resume/utils'
import { adminPrimaryButtonClass } from '@core/button-styles'

import { createIngestRagUserDocMethod } from '../services/ai-file-api'
import type { UserDocIngestResult, UserDocIngestScope } from '../types/ai-file.types'

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
  const [result, setResult] = useState<UserDocIngestResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { loading: ingesting, send: triggerIngest } = useRequest(
    (payload: { file: File; scope: UserDocIngestScope }) =>
      createIngestUserDocMethod({
        apiBaseUrl,
        accessToken,
        file: payload.file,
        scope: payload.scope,
      }),
    {
      force: true,
      immediate: false,
    },
  )

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

    try {
      const nextResult = await triggerIngest({
        file: selectedFile,
        scope,
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

        <div className="dashboard-inline-note rounded-[20px] border-zinc-200 bg-zinc-50 text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300">
          当前只做最小上传入库，不包含历史文件管理与批量操作。
        </div>

        {selectedFile ? (
          <div className="status-box bg-white dark:bg-zinc-900">
            <strong>待入库文件</strong>
            <span>
              {selectedFile.name} · {formatFileSize(selectedFile.size)}
            </span>
            <span>scope: {scope}</span>
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
        </div>
      ) : null}
    </section>
  )
}

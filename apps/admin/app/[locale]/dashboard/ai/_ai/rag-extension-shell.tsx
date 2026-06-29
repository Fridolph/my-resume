'use client'

import { Button, Chip, Form, ListBox, Select, Spinner, TextArea } from '@heroui/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { adminPrimaryButtonClass } from '@core/button-styles'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { createIngestRagUserDocMethod } from './services/ai-file-api'
import type { RagUserDocContentType } from './rag-extension.types'

const CONTENT_TYPE_OPTIONS: Array<{ label: string; value: RagUserDocContentType }> = [
  { label: '兴趣爱好', value: 'hobby' },
  { label: '技术博客', value: 'tech_blog' },
  { label: '知识专栏', value: 'knowledge_column' },
  { label: '工作经历补充', value: 'work_detail' },
  { label: '其他通用', value: 'general' },
  { label: '技术博客', value: 'tech_blog' },
  { label: '知识专栏', value: 'knowledge_column' },
  { label: '其他通用', value: 'general' },
]

export function RagExtensionShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<RagUserDocContentType>('tech_blog')
  const [linkUrl, setLinkUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [documents, setDocuments] = useState<Array<{
    id: string
    title: string
    contentType?: string
    createdAt: string
  }>>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)

  async function fetchDocuments() {
    if (!accessToken) return
    setDocumentsLoading(true)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/documents`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      const json = await res.json()
      const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : []
      setDocuments(list)
    } catch { /* ignore */ }
    finally { setDocumentsLoading(false) }
  }

  async function handleDelete(documentId: string) {
    if (!confirm('确定删除该资料及其所有关联数据？')) return
    try {
      await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/documents/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      await fetchDocuments()
    } catch {
      setErrorMessage('删除失败')
    }
  }

  useEffect(() => {
    if (accessToken) fetchDocuments()
  }, [accessToken])

  if (status !== 'ready' || !currentUser || !accessToken) {
    return null
  }

  const canUpload = Boolean(currentUser.capabilities.canTriggerAiAnalysis)

  if (!canUpload) {
    return (
      <div className="bg-[#ebebee] dark:bg-zinc-950">
        <section className="border-b border-zinc-200/80 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="readonly-box">
            <strong>当前角色只读</strong>
            <span>只有管理员可以扩展 RAG 个人资料库。</span>
          </div>
        </section>
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setErrorMessage(null)
    setResultMessage(null)

    try {
      // 拼接 Markdown 内容
      const markdown = [
        `# ${title || 'RAG 资料'}`,
        '',
        content,
        linkUrl ? `\n\n链接：${linkUrl}` : '',
      ].join('\n')
      const file = new File([markdown], `${title || 'rag-entry'}.md`, { type: 'text/markdown' })

      const result = await createIngestRagUserDocMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        file,
        scope: 'published',
        chunkingProfile: 'semantic',
        contentType,
        title,
      }).send()

      setResultMessage(`入库成功：${title || '资料'}，切块 ${result.chunkCount} 条`)
      setTitle('')
      setContent('')
      setLinkUrl('')
      fetchDocuments()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '入库失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  const shellClass =
    'border-b border-zinc-200/80 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5 sm:py-6 lg:px-6'

  return (
    <div className="bg-[#ebebee] dark:bg-zinc-950">
      <section className={shellClass}>
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">RAG 资料扩展</Chip>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
            RAG 资料扩展
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            这里可以扩展个人资料库，支持兴趣爱好、技术博客、知识专栏和通用资料。内容会自动分块向量化，在 AI 对话中被检索和引用。
          </p>
          <div className="dashboard-entry-actions">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href="/dashboard/ai">
              返回 AI 工作台
            </Link>
          </div>
        </div>
      </section>

      <section className={shellClass}>
        <div className="mb-4 grid gap-2">
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
            添加资料
          </h2>
          <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            输入标题、正文和类型，系统会自动语义分块并写入 RAG 检索态。
          </p>
        </div>

        <Form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="field">
            <span>标题</span>
            <TextArea
              aria-label="资料标题"
              className="min-h-[3rem]"
              onChange={(event: any) => setTitle(event.target.value)}
              placeholder="例如：我的易经学习心得"
              value={title}
              variant="secondary"
            />
          </label>

          <label className="field">
            <span>正文</span>
            <TextArea
              aria-label="资料内容"
              className="min-h-[10rem]"
              onChange={(event: any) => setContent(event.target.value)}
              placeholder="输入资料正文内容，支持 Markdown 格式..."
              value={content}
              variant="secondary"
            />
          </label>

          <label className="field">
            <span>内容类型</span>
            <Select
              aria-label="内容类型"
              fullWidth
              onSelectionChange={(key) => setContentType(String(key) as RagUserDocContentType)}
              selectedKey={contentType}
              variant="secondary">
              <Select.Trigger aria-label="内容类型">
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <ListBox.Item id={option.value} key={option.value} textValue={option.label}>
                      {option.label}
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>
          </label>

          <label className="field">
            <span>相关链接（可选）</span>
            <TextArea
              aria-label="相关链接"
              className="min-h-[2.5rem]"
              onChange={(event: any) => setLinkUrl(event.target.value)}
              placeholder="https://..."
              value={linkUrl}
              variant="secondary"
            />
          </label>

          {errorMessage ? <p className="error-text text-sm text-rose-600">{errorMessage}</p> : null}
          {resultMessage ? (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              {resultMessage}
            </p>
          ) : null}

          <Button
            className={adminPrimaryButtonClass}
            isDisabled={!content.trim() || isSubmitting}
            size="md"
            type="submit"
            variant="primary">
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" />
                正在写入...
              </span>
            ) : (
              '提交并写入 RAG 检索态'
            )}
          </Button>
        </Form>
      </section>

      <section className={shellClass}>
        <div className="mb-4 grid gap-2">
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
            已入库资料
          </h2>
        </div>

        {documentsLoading ? (
          <div className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <Spinner size="sm" /> 加载中...
          </div>
        ) : documents.length === 0 || !Array.isArray(documents) ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-500">暂无入库资料。</p>
        ) : (
          <div className="grid gap-2">
            {documents.map((doc) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200/80 bg-zinc-50/80 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/60"
                key={doc.id}>
                <div className="grid gap-1">
                  <strong className="text-sm text-zinc-950 dark:text-white">{doc.title}</strong>
                  <div className="flex flex-wrap items-center gap-2">
                    {doc.contentType ? (
                      <Chip size="sm" variant="soft">
                        {doc.contentType === 'hobby' ? '兴趣爱好' : doc.contentType === 'tech_blog' ? '技术博客' : doc.contentType === 'knowledge_column' ? '知识专栏' : doc.contentType === 'work_detail' ? '工作经历补充' : doc.contentType === 'general' ? '其他通用' : doc.contentType}
                      </Chip>
                    ) : null}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(doc.createdAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <Button
                  className="text-xs"
                  onPress={() => void handleDelete(doc.id)}
                  size="sm"
                  variant="danger">
                  删除
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

'use client'

import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Form, Spinner, Table, Tabs, TextArea, Tooltip } from '@heroui/react'
import { useEffect, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { adminPrimaryButtonClass } from '@core/button-styles'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { AiUserDocIngestionPanel } from './components/user-doc-ingestion-panel'
import { createIngestRagUserDocMethod } from './services/ai-file-api'
import type { UserDocIngestResult } from './types/ai-file.types'
import type { RagUserDocContentType } from './rag-extension.types'

const CONTENT_TYPE_OPTIONS: Array<{ label: string; value: RagUserDocContentType }> = [
  { label: '技术博客 / 文章', value: 'article' },
  { label: '兴趣爱好', value: 'hobby' },
  { label: '媒体 / 视频', value: 'media' },
  { label: '通用', value: 'general' },
]

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}

function contentTypeLabel(type?: string) {
  const map: Record<string, string> = { article: '文章', hobby: '兴趣爱好', media: '媒体', general: '通用' }
  return map[type ?? ''] ?? type ?? '—'
}

function ViewIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M4 12s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M6 7h12M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M5 7l1.5 12a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1L19 7" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="M10.5 11v6M13.5 11v6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  )
}

const actionIconClass = [
  'inline-flex h-8 w-8 min-w-8 items-center justify-center rounded-full p-0 text-zinc-500',
  'transition-colors focus-visible:ring-2 focus-visible:ring-blue-500/20',
  'data-[hovered=true]:text-zinc-900',
  'dark:text-zinc-300',
  'dark:data-[hovered=true]:text-white',
].join(' ')

interface RagDocument {
  id: string
  title: string
  contentType?: string
  sourceScope?: string
  chunkCount?: number
  preview?: string | null
  fileName?: string
  fileType?: string
  createdAt: string
}

export function RagManageShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()

  // Tab 1: 自定义数据
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState<RagUserDocContentType>('article')
  const [linkUrl, setLinkUrl] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formResult, setFormResult] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // Tab 2: 文件上传
  const [uploadResult, setUploadResult] = useState<UserDocIngestResult | null>(null)

  // Tab 3: 文档管理
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [viewDetail, setViewDetail] = useState<RagDocument | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  if (status !== 'ready' || !currentUser || !accessToken) return null

  const canUpload = Boolean(currentUser.capabilities.canTriggerAiAnalysis)
  if (!canUpload) {
    return (
      <div className="bg-[#ebebee] dark:bg-zinc-950">
        <section className="border-b border-zinc-200/80 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950">
          <div className="readonly-box">
            <strong>当前角色只读</strong>
            <span>只有管理员可以管理 RAG 资料库。</span>
          </div>
        </section>
      </div>
    )
  }

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
    setDeletingId(documentId)
    setActionError(null)
    try {
      await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/documents/${documentId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      await fetchDocuments()
    } catch {
      setActionError('删除失败')
    } finally { setDeletingId(null) }
  }

  async function handleCustomSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!content.trim()) return
    setIsSubmitting(true)
    setFormError(null)
    setFormResult(null)
    try {
      const res = await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken ?? ''}`,
        },
        body: JSON.stringify({
          title: title || undefined,
          content,
          contentType,
          linkUrl: linkUrl || undefined,
          scope: 'published',
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || '入库失败')
      const data = json.data ?? json
      setFormResult(`入库成功：${title || '资料'}，切块 ${data.chunkCount} 条`)
      setTitle(''); setContent(''); setLinkUrl('')
      fetchDocuments()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : '入库失败')
    } finally { setIsSubmitting(false) }
  }

  useEffect(() => { if (accessToken) fetchDocuments() }, [accessToken])

  return (
    <div className="stack">
      <Card>
        <CardHeader className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="soft">RAG 管理</Chip>
            <Chip size="sm" variant="soft">{documents.length} 条资料</Chip>
          </div>
          <div className="grid gap-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              RAG 知识库管理
            </CardTitle>
            <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              管理简历之外的 RAG 检索资料：通过自定义表单或文件上传添加文章、兴趣爱好、媒体等内容，已入库资料可在此管理。
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs aria-label="RAG 管理模块">
        <Tabs.List>
          <Tabs.Tab className="data-[selected=true]:border-b-2 data-[selected=true]:border-[color:var(--admin-primary)]" id="custom">自定义数据</Tabs.Tab>
          <Tabs.Tab className="data-[selected=true]:border-b-2 data-[selected=true]:border-[color:var(--admin-primary)]" id="upload">文件上传</Tabs.Tab>
          <Tabs.Tab className="data-[selected=true]:border-b-2 data-[selected=true]:border-[color:var(--admin-primary)]" id="manage">已入库管理</Tabs.Tab>
        </Tabs.List>

        {/* Tab 1: 自定义数据添加 */}
        <Tabs.Panel id="custom">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">添加自定义数据</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                输入标题、正文和内容类型（文章/兴趣爱好/媒体等），系统自动语义分块写入 RAG 检索态。
              </p>
              <Form className="grid gap-4" onSubmit={(event) => void handleCustomSubmit(event)}>
                <label className="field">
                  <span>标题</span>
                  <TextArea className="min-h-[3rem]" onChange={(e: any) => setTitle(e.target.value)} placeholder="例如：我的易经学习心得" value={title} />
                </label>
                <label className="field">
                  <span>正文</span>
                  <TextArea className="min-h-[10rem]" onChange={(e: any) => setContent(e.target.value)} placeholder="输入资料正文内容，支持 Markdown 格式..." value={content} />
                </label>
                <label className="field">
                  <span>内容类型</span>
                  <select
                    className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-700 outline-none transition focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:focus:border-zinc-600"
                    onChange={(e: any) => setContentType(e.target.value as RagUserDocContentType)}
                    value={contentType}>
                    {CONTENT_TYPE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                  </select>
                </label>
                <label className="field">
                  <span>相关链接（可选）</span>
                  <TextArea className="min-h-[2.5rem]" onChange={(e: any) => setLinkUrl(e.target.value)} placeholder="https://..." value={linkUrl} />
                </label>
                {formError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">{formError}</p> : null}
                {formResult ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">{formResult}</p> : null}
                <Button
                  className={adminPrimaryButtonClass}
                  isDisabled={!content.trim() || isSubmitting}
                  size="md"
                  type="submit"
                  variant="primary">
                  {isSubmitting ? <span className="inline-flex items-center gap-2"><Spinner size="sm" />正在写入...</span> : '提交并写入 RAG 检索态'}
                </Button>
              </Form>
            </CardContent>
          </Card>
        </Tabs.Panel>

        {/* Tab 2: 文件上传 */}
        <Tabs.Panel id="upload">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">上传文件入库</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                通过上传 md/txt/pdf/docx 文件的方式添加资料，系统自动提取文本并写入 RAG 检索态。
              </p>
              <AiUserDocIngestionPanel
                accessToken={accessToken}
                apiBaseUrl={DEFAULT_API_BASE_URL}
                canUpload={canUpload}
                onIngested={(result) => { setUploadResult(result); fetchDocuments() }}
              />
              {uploadResult ? (
                <div className="mt-4 grid gap-1 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-sm dark:border-emerald-500/20 dark:bg-emerald-500/10">
                  <strong className="text-emerald-800 dark:text-emerald-200">入库成功</strong>
                  <span className="text-emerald-700 dark:text-emerald-300">{uploadResult.fileName} · {uploadResult.sourceScope} · 切块 {uploadResult.chunkCount} 条</span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </Tabs.Panel>

        {/* Tab 3: 已入库管理 */}
        <Tabs.Panel id="manage">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">已入库资料</CardTitle>
            </CardHeader>
            <CardContent>
              {actionError ? (
                <div className="mb-4 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
                  {actionError}
                </div>
              ) : null}

              {documentsLoading ? (
                <div className="flex justify-center py-10 text-sm text-zinc-500">加载中...</div>
              ) : documents.length === 0 ? (
                <div className="grid min-h-[10rem] place-items-center rounded-[1rem] border border-dashed border-zinc-200/80 text-center dark:border-zinc-800">
                  <div className="grid gap-2">
                    <strong className="text-base text-zinc-950 dark:text-white">暂无入库资料</strong>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">在自定义数据或文件上传标签页添加资料后将出现在这里。</span>
                  </div>
                </div>
              ) : (
                <Table>
                  <Table.Content aria-label="RAG 已入库资料列表">
                    <Table.Header>
                      <Table.Column isRowHeader>标题</Table.Column>
                      <Table.Column>类型</Table.Column>
                      <Table.Column>内容预览</Table.Column>
                      <Table.Column>更新时间</Table.Column>
                      <Table.Column className="w-28 text-right">操作</Table.Column>
                    </Table.Header>
                    <Table.Body items={documents}>
                      {(doc) => (
                        <Table.Row key={doc.id}>
                          <Table.Cell>
                            <div className="grid gap-0.5">
                              <strong className="text-sm text-zinc-950 dark:text-white">{doc.title || doc.fileName || '未命名'}</strong>
                              {doc.fileName && doc.title !== doc.fileName ? (
                                <span className="text-xs text-zinc-400 dark:text-zinc-500">{doc.fileName} · {doc.fileType?.toUpperCase()}</span>
                              ) : null}
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <Chip size="sm" variant="soft">{contentTypeLabel(doc.contentType)}</Chip>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                              {doc.preview ?? '—'}
                            </span>
                          </Table.Cell>
                          <Table.Cell>
                            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(doc.createdAt)}</span>
                          </Table.Cell>
                          <Table.Cell>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                aria-label="查看详情"
                                className={actionIconClass}
                                onClick={() => setViewDetail(doc)}
                                type="button">
                                <ViewIcon />
                              </button>
                              {deleteConfirmId === doc.id ? (
                                <>
                                  <button
                                    className="rounded-lg bg-rose-600 px-2 py-1 text-[0.65rem] font-medium text-white hover:bg-rose-700"
                                    onClick={() => { handleDelete(doc.id); setDeleteConfirmId(null) }}
                                    type="button">确认</button>
                                  <button
                                    className="rounded-lg border border-zinc-300 px-2 py-1 text-[0.65rem] text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                    onClick={() => setDeleteConfirmId(null)}
                                    type="button">取消</button>
                                </>
                              ) : (
                                <button
                                  aria-label="删除资料"
                                  className={actionIconClass}
                                  disabled={deletingId === doc.id}
                                  onClick={() => setDeleteConfirmId(doc.id)}
                                  type="button">
                                  <TrashIcon />
                                </button>
                              )}
                            </div>
                          </Table.Cell>
                        </Table.Row>
                      )}
                    </Table.Body>
                  </Table.Content>
                </Table>
              )}
            </CardContent>
          </Card>
        </Tabs.Panel>
      </Tabs>

      {/* 查看详情 Dialog */}
      {viewDetail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setViewDetail(null)}>
          <div className="mx-4 max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-2xl dark:border-zinc-700 dark:bg-zinc-950" onClick={(e) => e.stopPropagation()}>
            <div className="grid gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid gap-1">
                  <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">{viewDetail.title || '未命名'}</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <Chip size="sm" variant="soft">{contentTypeLabel(viewDetail.contentType)}</Chip>
                    <span className="text-xs text-zinc-400">{formatDateTime(viewDetail.createdAt)}</span>
                  </div>
                </div>
                <Button aria-label="关闭" className={actionIconClass} isIconOnly onPress={() => setViewDetail(null)} size="sm" variant="ghost">✕</Button>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="grid grid-cols-[6rem_1fr] gap-2">
                    <span className="text-xs text-zinc-400">文档 ID</span>
                    <span className="font-mono text-xs">{viewDetail.id.slice(0, 32)}...</span>
                  </div>
                  {viewDetail.preview ? (
                    <div className="grid gap-1">
                      <span className="text-xs text-zinc-400">内容预览</span>
                      <p className="whitespace-pre-wrap text-sm leading-6">{viewDetail.preview}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

'use client'

import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Table, Tooltip } from '@heroui/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { AiUserDocIngestionPanel } from './components/user-doc-ingestion-panel'
import type { UserDocIngestResult } from './types/ai-file.types'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
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
  fileName?: string
  fileType?: string
  createdAt: string
}

export function RagManageShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const [documents, setDocuments] = useState<RagDocument[]>([])
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<UserDocIngestResult | null>(null)
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
    setDeleteConfirmId(null)
    setActionError(null)
    try {
      await fetch(`${DEFAULT_API_BASE_URL}/api/ai/rag/documents/${documentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken ?? ''}` },
      })
      await fetchDocuments()
    } catch {
      setActionError('删除失败')
    } finally {
      setDeletingId(null)
    }
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
              管理简历之外的 RAG 检索资料。上传文件或通过自定义表单添加内容，已入库资料可在此增删查改。
            </p>
          </div>
        </CardHeader>
      </Card>

      {/* 上传区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">上传文件入库</CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* 文档管理 Table */}
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
                <span className="text-sm text-zinc-500 dark:text-zinc-400">上传文件后将自动出现在这里。</span>
              </div>
            </div>
          ) : (
            <Table>
              <Table.Content aria-label="RAG 已入库资料列表">
                <Table.Header>
                  <Table.Column isRowHeader>标题</Table.Column>
                  <Table.Column>类型</Table.Column>
                  <Table.Column>切块</Table.Column>
                  <Table.Column>更新时间</Table.Column>
                  <Table.Column className="w-20 text-right">操作</Table.Column>
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
                        <span className="text-sm text-zinc-600 dark:text-zinc-300">{doc.chunkCount ?? '—'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(doc.createdAt)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip delay={180}>
                            <Tooltip.Trigger>
                              <Button
                                aria-label="查看详情"
                                className={actionIconClass}
                                isIconOnly
                                size="sm"
                                type="button"
                                variant="ghost">
                                <ViewIcon />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content offset={10} placement="top">查看详情</Tooltip.Content>
                          </Tooltip>
                          <Tooltip delay={180}>
                            <Tooltip.Trigger>
                              <Button
                                aria-label="删除资料"
                                className={actionIconClass}
                                isDisabled={deletingId === doc.id}
                                isIconOnly
                                onPress={() => setDeleteConfirmId(doc.id)}
                                size="sm"
                                type="button"
                                variant="ghost">
                                <TrashIcon />
                              </Button>
                            </Tooltip.Trigger>
                            <Tooltip.Content offset={10} placement="top">删除</Tooltip.Content>
                          </Tooltip>
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

      {/* 返回 */}
      <div className="dashboard-entry-actions">
        <Link
          className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
          href="/dashboard/ai">
          返回 AI 工作台
        </Link>
      </div>
    </div>
  )
}

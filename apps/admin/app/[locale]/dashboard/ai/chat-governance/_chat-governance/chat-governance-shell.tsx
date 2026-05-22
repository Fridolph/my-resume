'use client'

import { useRequest } from 'alova/client'
import {
  createDeleteAiChatUseKeyMethod,
  createFetchAiChatLeadsMethod,
  createFetchAiChatSessionDetailMethod,
  createFetchAiChatSessionsMethod,
  createFetchAiChatUseKeysMethod,
} from '@my-resume/api-client'
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Drawer, Modal, Table, Tooltip } from '@heroui/react'
import { useMemo, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import { AdminDrawerShell } from '../../../../../_shared/ui/components/heroui'
import type { AiChatLeadSummary, AiChatSession, AiChatSessionListItem, AiChatUseKeySummary } from '@my-resume/api-client'

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function extractSourceKey(lead: AiChatLeadSummary | undefined): string {
  const raw = (lead as any)?.sourceKey ?? ''
  if (typeof raw !== 'string' || !raw) return '—'
  const parts = raw.split(':')
  return parts[2] ? `${parts[2].slice(0, 10)}...` : raw
}

function shortId(id: string) {
  return id.slice(0, 8)
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

interface MergedRow {
  id: string
  sessionId: string | null
  sourceKey: string
  sessionStatus: string
  turns: string
  useKeyValue: string | null
  useKeyStatus: string
  createdAt: string
  updatedAt: string
}

export function ChatGovernanceShell() {
  const { accessToken, status } = useAdminSession()
  const [sessionDetailId, setSessionDetailId] = useState<string | null>(null)
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null)
  const [deletingUseKey, setDeletingUseKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const leadsRequest = useRequest(
    () => createFetchAiChatLeadsMethod({ apiBaseUrl: DEFAULT_API_BASE_URL, accessToken: accessToken ?? '' }),
    { immediate: status === 'ready' && Boolean(accessToken), force: true },
  )
  const useKeysRequest = useRequest(
    () => createFetchAiChatUseKeysMethod({ apiBaseUrl: DEFAULT_API_BASE_URL, accessToken: accessToken ?? '' }),
    { immediate: status === 'ready' && Boolean(accessToken), force: true },
  )
  const sessionsRequest = useRequest(
    () => createFetchAiChatSessionsMethod({ apiBaseUrl: DEFAULT_API_BASE_URL, accessToken: accessToken ?? '' }),
    { immediate: status === 'ready' && Boolean(accessToken), force: true },
  )
  const sessionDetailRequest = useRequest(
    () =>
      createFetchAiChatSessionDetailMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        sessionId: sessionDetailId ?? '',
      }),
    { immediate: false, force: true },
  )

  const leads = (leadsRequest.data ?? []) as AiChatLeadSummary[]
  const useKeys = (useKeysRequest.data ?? []) as AiChatUseKeySummary[]
  const sessions = (sessionsRequest.data ?? []) as AiChatSessionListItem[]
  const sessionDetail = (sessionDetailRequest.data ?? null) as AiChatSession | null

  const mergedRows = useMemo<MergedRow[]>(() => {
    const leadMap = new Map(leads.map((l) => [l.id, l]))

    return sessions.map((s) => {
      const relatedKeys = useKeys.filter((k) => k.sessionId === s.id || k.leadId === s.id)
      const relatedKey = relatedKeys[0] ?? null
      const lead = leadMap.get(relatedKey?.leadId ?? s.id)

      return {
        id: s.id,
        sessionId: s.id,
        sourceKey: extractSourceKey(lead),
        sessionStatus: s.status,
        turns: `${s.turnCount} / ${relatedKey?.maxTurns ?? 20}`,
        useKeyValue: relatedKey?.useKey ?? null,
        useKeyStatus: relatedKey?.status ?? '—',
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      }
    })
  }, [leads, useKeys, sessions])

  async function refreshAll() {
    setActionError(null)
    await Promise.all([leadsRequest.send(), useKeysRequest.send(), sessionsRequest.send()])
  }

  async function openSessionDetail(sessionId: string) {
    setSessionDetailId(sessionId)
    setActionError(null)
    try {
      await sessionDetailRequest.send()
    } catch {
      setActionError('会话详情加载失败，请稍后重试')
    }
  }

  async function deleteUseKey(useKey: string) {
    setDeletingUseKey(useKey)
    setActionError(null)
    try {
      await createDeleteAiChatUseKeyMethod({ apiBaseUrl: DEFAULT_API_BASE_URL, accessToken: accessToken ?? '', useKey }).send()
      await refreshAll()
    } catch {
      setActionError('useKey 删除失败')
    } finally {
      setDeletingUseKey(null)
      setDeleteConfirmKey(null)
    }
  }

  return (
    <div className="stack">
      <Card>
        <CardHeader className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="soft">公开站 AI Chat</Chip>
            <Chip size="sm" variant="soft">1 IP = 1 会话 = 20 轮/日</Chip>
          </div>
          <div className="grid gap-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              AI Chat 治理台
            </CardTitle>
            <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              公开站按访客 IP 维度发放 useKey。可查看对话详情或删除会话（清空所有记录 + key），删除后访客再次进入需重新认领。
            </p>
          </div>
        </CardHeader>
      </Card>

      {actionError ? (
        <div className="rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-900 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-100">
          {actionError}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">
            会话与 useKey
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mergedRows.length === 0 ? (
            <div className="grid min-h-[10rem] place-items-center rounded-[1rem] border border-dashed border-zinc-200/80 text-center dark:border-zinc-800">
              <div className="grid gap-2">
                <strong className="text-base text-zinc-950 dark:text-white">暂无数据</strong>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">访客从公开站进入 AI Chat 后，这里会出现记录。</span>
              </div>
            </div>
          ) : (
            <Table>
              <Table.Content aria-label="AI Chat 会话治理列表">
                <Table.Header>
                  <Table.Column isRowHeader>会话 ID</Table.Column>
                  <Table.Column>访客 IP</Table.Column>
                  <Table.Column>会话状态</Table.Column>
                  <Table.Column>轮次</Table.Column>
                  <Table.Column>useKey</Table.Column>
                  <Table.Column>更新时间</Table.Column>
                  <Table.Column className="w-16 text-right">操作</Table.Column>
                </Table.Header>
                <Table.Body items={mergedRows}>
                  {(row) => (
                    <Table.Row key={row.id}>
                      <Table.Cell>
                        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">{row.sessionId ? shortId(row.sessionId) : '—'}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{row.sourceKey}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip
                          color={row.sessionStatus === 'open' ? 'success' : 'default'}
                          size="sm"
                          variant="soft">
                          <Chip.Label>{row.sessionStatus === 'open' ? '进行中' : row.sessionStatus}</Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-sm text-zinc-700 dark:text-zinc-200">{row.turns}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <Chip size="sm" variant="soft">
                          <Chip.Label>{row.useKeyStatus}</Chip.Label>
                        </Chip>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(row.updatedAt)}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-1.5">
                          {row.sessionId ? (
                            <Tooltip delay={180}>
                              <Tooltip.Trigger>
                                <Button
                                  aria-label="查看会话详情"
                                  className={actionIconClass}
                                  isIconOnly
                                  onPress={() => void openSessionDetail(row.sessionId!)}
                                  size="sm"
                                  type="button"
                                  variant="ghost">
                                  <ViewIcon />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content offset={10} placement="top">查看详情</Tooltip.Content>
                            </Tooltip>
                          ) : null}
                          {row.useKeyValue ? (
                            <Tooltip delay={180}>
                              <Tooltip.Trigger>
                                <Button
                                  aria-label="删除会话"
                                  className={actionIconClass}
                                  isDisabled={deletingUseKey === row.useKeyValue}
                                  isIconOnly
                                  onPress={() => setDeleteConfirmKey(row.useKeyValue)}
                                  size="sm"
                                  type="button"
                                  variant="ghost">
                                  <TrashIcon />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content offset={10} placement="top">删除会话</Tooltip.Content>
                            </Tooltip>
                          ) : null}
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

      <AdminDrawerShell dialogClassName="!p-0 w-full max-w-2xl" isOpen={Boolean(sessionDetailId)} onClose={() => setSessionDetailId(null)}>
        <Drawer.Header>
          <Drawer.Heading>会话详情</Drawer.Heading>
          <Drawer.CloseTrigger aria-label="关闭会话详情" />
        </Drawer.Header>
        <Drawer.Body className="grid min-h-0 gap-4">
          {sessionDetailRequest.loading ? <p className="text-sm text-zinc-500">加载中...</p> : null}
          {sessionDetail ? (
            <>
              <div className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="grid gap-0.5">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">访客标识</span>
                    <strong className="text-zinc-950 dark:text-white">{sessionDetail.lead?.displayName ?? '未知访客'}</strong>
                  </div>
                  <div className="grid gap-0.5">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">访客 IP</span>
                    <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">{extractSourceKey(sessionDetail.lead)}</span>
                  </div>
                  <div className="grid gap-0.5">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">会话状态</span>
                    <Chip color={sessionDetail.status === 'open' ? 'success' : 'default'} size="sm" variant="soft">
                      {sessionDetail.status === 'open' ? '进行中' : sessionDetail.status}
                    </Chip>
                  </div>
                  <div className="grid gap-0.5">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">对话轮次</span>
                    <span className="font-mono text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.turnCount} / 20</span>
                  </div>
                </div>
                {sessionDetail.lead?.companyName ? (
                  <div className="grid gap-0.5 border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">公司</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.lead.companyName}</span>
                  </div>
                ) : null}
                {sessionDetail.lead?.contact ? (
                  <div className="grid gap-0.5 border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">联系信息</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.lead.contact}</span>
                  </div>
                ) : null}
                {sessionDetail.lead?.message ? (
                  <div className="grid gap-0.5 border-t border-zinc-200/60 pt-2 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">访客留言</span>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{sessionDetail.lead.message}</span>
                  </div>
                ) : null}
                {sessionDetail.interimSummary ? (
                  <details className="mt-1 rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-2.5 dark:border-emerald-500/15 dark:bg-emerald-500/8">
                    <summary className="cursor-pointer text-xs font-medium text-emerald-700 dark:text-emerald-300">第 10 轮摘要</summary>
                    <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-200">{sessionDetail.interimSummary.summary}</p>
                  </details>
                ) : null}
                {sessionDetail.finalSummary ? (
                  <details className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-2.5 dark:border-emerald-500/15 dark:bg-emerald-500/8">
                    <summary className="cursor-pointer text-xs font-medium text-emerald-700 dark:text-emerald-300">第 20 轮摘要</summary>
                    <p className="mt-1 text-xs leading-5 text-emerald-800 dark:text-emerald-200">{sessionDetail.finalSummary.summary}</p>
                  </details>
                ) : null}
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  创建：{formatDateTime(sessionDetail.createdAt)} · 更新：{formatDateTime(sessionDetail.updatedAt)}
                </span>
              </div>

              <div className="grid gap-0.5">
                <span className="px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
              聊天记录（{sessionDetail.messages?.length ?? 0} 条消息）
            </span>
            <div className="grid min-h-0 gap-2 overflow-y-auto rounded-2xl border border-zinc-200/80 bg-zinc-50/40 p-3 dark:border-zinc-800 dark:bg-zinc-950/60">
              {!sessionDetail.messages || sessionDetail.messages.length === 0 ? (
                    <div className="grid place-items-center py-10 text-sm text-zinc-400 dark:text-zinc-500">
                      暂无聊天消息
                    </div>
                  ) : (
                    sessionDetail.messages.map((message, index) => {
                      const isUser = message.role === 'user'
                      const prevMessage = index > 0 ? sessionDetail.messages[index - 1] : null
                      const showRoleLabel = !prevMessage || prevMessage.role !== message.role

                      return (
                        <div
                          className={`grid gap-1 ${isUser ? 'justify-items-end' : 'justify-items-start'}`}
                          key={message.id}>
                          {showRoleLabel ? (
                            <span className={`px-1 text-[0.62rem] font-semibold uppercase tracking-[0.12em] ${isUser ? 'text-right text-amber-600/80 dark:text-amber-400/80' : 'text-sky-600/80 dark:text-sky-400/80'}`}>
                              {isUser ? '访客' : 'AI 助手'} · 第 {message.turnIndex} 轮
                            </span>
                          ) : null}
                          <div
                            className={[
                              'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-6',
                              isUser
                                ? 'rounded-br-lg bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                                : 'rounded-bl-lg border border-zinc-200/80 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200',
                            ].join(' ')}>
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            {message.answerBlocks && message.answerBlocks.length > 0 && !isUser ? (
                              <div className="mt-2 grid gap-2 border-t border-zinc-200/60 pt-2 dark:border-zinc-700">
                                {message.answerBlocks.map((block, blockIndex) => {
                                  if (block.type === 'project_card' || block.type === 'experience_card') {
                                    return (
                                      <div className="rounded-xl border border-blue-200/60 bg-blue-50/60 p-2.5 dark:border-blue-500/15 dark:bg-blue-500/8" key={`${block.type}-${blockIndex}`}>
                                        <strong className="block text-xs text-zinc-800 dark:text-zinc-200">{block.title}</strong>
                                        <span className="text-[0.68rem] text-zinc-500 dark:text-zinc-400">{block.subtitle} · {block.period}</span>
                                        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{block.summary}</p>
                                      </div>
                                    )
                                  }
                                  if (block.type === 'summary') {
                                    return (
                                      <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-2.5 dark:border-emerald-500/15 dark:bg-emerald-500/8" key={`${block.type}-${blockIndex}`}>
                                        <strong className="block text-xs text-zinc-800 dark:text-zinc-200">{block.title}</strong>
                                        <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300">{block.summary}</p>
                                      </div>
                                    )
                                  }
                                  return null
                                })}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : null}
        </Drawer.Body>
      </AdminDrawerShell>

      <Modal.Backdrop
        isDismissable={!deletingUseKey}
        isOpen={Boolean(deleteConfirmKey)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !deletingUseKey) setDeleteConfirmKey(null)
        }}>
        <Modal.Container placement="center">
          <Modal.Dialog className="rounded-[2rem] border border-zinc-200/80 bg-white/96 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.16)] dark:border-zinc-800 dark:bg-zinc-950/96">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">确认删除会话？</h3>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  将删除该 useKey 及其关联的所有会话记录和聊天消息。该访客再次进入 AI 对话时需重新认领 IP，自动获得新的 useKey 和 20 轮对话额度。
                </p>
              </div>
              <div className="flex justify-end gap-3">
                <Button isDisabled={Boolean(deletingUseKey)} onPress={() => setDeleteConfirmKey(null)} variant="ghost">
                  取消
                </Button>
                <Button
                  isDisabled={Boolean(deletingUseKey)}
                  onPress={() => void deleteUseKey(deleteConfirmKey!)}
                  variant="danger">
                  {deletingUseKey ? '删除中...' : '确认删除'}
                </Button>
              </div>
            </div>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </div>
  )
}

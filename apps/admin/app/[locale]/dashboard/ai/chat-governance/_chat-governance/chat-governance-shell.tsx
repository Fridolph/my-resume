'use client'

import { useRequest } from 'alova/client'
import {
  createClearAiChatSessionMessagesMethod,
  createDeleteAiChatUseKeyMethod,
  createFetchAiChatLeadsMethod,
  createFetchAiChatSessionDetailMethod,
  createFetchAiChatSessionsMethod,
  createFetchAiChatUseKeysMethod,
  createResetAiChatSessionMethod,
} from '@my-resume/api-client'
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, CloseButton, Modal, Table, Tooltip } from '@heroui/react'
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
  // sourceKey 格式: public-ip:2026-05-15:abc123...
  const parts = raw.split(':')
  return parts[2] ? `${parts[2].slice(0, 10)}...` : raw
}

function ViewIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M4 12s2.8-5 8-5 8 5 8 5-2.8 5-8 5-8-5-8-5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function ResetIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <path d="M3 12a9 9 0 1 1 3 6.9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M3 8v4h4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
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

function BanIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="16" viewBox="0 0 24 24" width="16">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5.5 5.5l13 13" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
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
  /** HeroUI v3 Table 要求每个 item 有 id */
  id: string
  /** 会话 ID，用于查看详情 */
  sessionId: string | null
  /** 访客 IP hash */
  sourceKey: string
  /** 会话状态 */
  sessionStatus: string
  /** 当前/最大轮次 */
  turns: string
  /** useKey 值（用于作废） */
  useKeyValue: string | null
  /** useKey 状态 */
  useKeyStatus: string
  /** 创建时间 */
  createdAt: string
  /** 最后更新时间 */
  updatedAt: string
}

export function ChatGovernanceShell() {
  const { accessToken, status } = useAdminSession()
  const [sessionDetailId, setSessionDetailId] = useState<string | null>(null)
  const [resettingSessionId, setResettingSessionId] = useState<string | null>(null)
  const [clearingSessionId, setClearingSessionId] = useState<string | null>(null)
  const [revokingUseKey, setRevokingUseKey] = useState<string | null>(null)
  const [deletingUseKey, setDeletingUseKey] = useState<string | null>(null)
  const [deleteConfirmKey, setDeleteConfirmKey] = useState<string | null>(null)
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

  // 合并三张表为统一行：以 session 为主，join useKey + lead
  const mergedRows = useMemo<MergedRow[]>(() => {
    const leadMap = new Map(leads.map((l) => [l.id, l]))
    const keyMap = new Map(useKeys.map((k) => [k.leadId, k]))

    return sessions.map((s) => {
      const relatedKeys = useKeys.filter((k) => k.sessionId === s.id || k.leadId === s.id)
      const relatedKey = relatedKeys[0] ?? keyMap.get(s.id) ?? null
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

  async function resetSession(sessionId: string) {
    if (!window.confirm('确认重置此会话？将清空所有聊天记录并将轮次归零。')) return
    setResettingSessionId(sessionId)
    setActionError(null)
    try {
      await createResetAiChatSessionMethod({ apiBaseUrl: DEFAULT_API_BASE_URL, accessToken: accessToken ?? '', sessionId }).send()
      await refreshAll()
    } catch {
      setActionError('会话重置失败')
    } finally {
      setResettingSessionId(null)
    }
  }

  async function clearMessages(sessionId: string) {
    if (!window.confirm('确认清空此会话的聊天记录？（轮次进度保留）')) return
    setClearingSessionId(sessionId)
    setActionError(null)
    try {
      await createClearAiChatSessionMessagesMethod({ apiBaseUrl: DEFAULT_API_BASE_URL, accessToken: accessToken ?? '', sessionId }).send()
      await refreshAll()
    } catch {
      setActionError('聊天记录清空失败')
    } finally {
      setClearingSessionId(null)
    }
  }

  async function revokeUseKey(useKey: string) {
    if (!window.confirm('确认作废此 useKey？该访客将无法继续 AI 对话。')) return
    setRevokingUseKey(useKey)
    setActionError(null)
    try {
      await createDeleteAiChatUseKeyMethod({ apiBaseUrl: DEFAULT_API_BASE_URL, accessToken: accessToken ?? '', useKey }).send()
      await refreshAll()
    } catch {
      setActionError('useKey 作废失败')
    } finally {
      setRevokingUseKey(null)
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
            <Chip size="sm" variant="soft">按 IP 维度管理</Chip>
          </div>
          <div className="grid gap-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              AI Chat 治理台
            </CardTitle>
            <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              公开站按访客 IP 维度发放 useKey（1 IP = 1 会话 = 20 轮/日）。可重置进度、清空记录或作废 key。
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
                  <Table.Column isRowHeader>访客 IP</Table.Column>
                  <Table.Column>会话状态</Table.Column>
                  <Table.Column>已用轮次</Table.Column>
                  <Table.Column>useKey</Table.Column>
                  <Table.Column>更新时间</Table.Column>
                  <Table.Column className="w-32 text-right">操作</Table.Column>
                </Table.Header>
                <Table.Body items={mergedRows}>
                  {(row) => (
                    <Table.Row key={row.sessionId ?? row.sourceKey}>
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
                          {row.sessionId ? (
                            <Tooltip delay={180}>
                              <Tooltip.Trigger>
                                <Button
                                  aria-label="重置会话进度"
                                  className={actionIconClass}
                                  isDisabled={resettingSessionId === row.sessionId}
                                  isIconOnly
                                  onPress={() => void resetSession(row.sessionId!)}
                                  size="sm"
                                  type="button"
                                  variant="ghost">
                                  <ResetIcon />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content offset={10} placement="top">重置进度</Tooltip.Content>
                            </Tooltip>
                          ) : null}
                          {row.sessionId ? (
                            <Tooltip delay={180}>
                              <Tooltip.Trigger>
                                <Button
                                  aria-label="清空聊天记录"
                                  className={actionIconClass}
                                  isDisabled={clearingSessionId === row.sessionId}
                                  isIconOnly
                                  onPress={() => void clearMessages(row.sessionId!)}
                                  size="sm"
                                  type="button"
                                  variant="ghost">
                                  <TrashIcon />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content offset={10} placement="top">清空记录</Tooltip.Content>
                            </Tooltip>
                          ) : null}
                          {row.useKeyValue && row.useKeyStatus !== 'revoked' ? (
                            <Tooltip delay={180}>
                              <Tooltip.Trigger>
                                <Button
                                  aria-label="删除 useKey"
                                  className={actionIconClass}
                                  isDisabled={deletingUseKey === row.useKeyValue}
                                  isIconOnly
                                  onPress={() => setDeleteConfirmKey(row.useKeyValue)}
                                  size="sm"
                                  type="button"
                                  variant="ghost">
                                  <BanIcon />
                                </Button>
                              </Tooltip.Trigger>
                              <Tooltip.Content offset={10} placement="top">删除 useKey</Tooltip.Content>
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

      <AdminDrawerShell dialogClassName="w-full max-w-3xl" isOpen={Boolean(sessionDetailId)} onClose={() => setSessionDetailId(null)}>
        <div className="grid min-h-[20rem] gap-3">
          <div className="flex items-center justify-between border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">会话详情</h2>
            <CloseButton aria-label="关闭会话详情" onPress={() => setSessionDetailId(null)} />
          </div>
          <div className="grid gap-4 px-4 py-3">
            {sessionDetailRequest.loading ? <p className="text-sm text-zinc-500">加载中...</p> : null}
            {sessionDetail ? (
              <>
                <div className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                  <strong>{sessionDetail?.lead?.displayName ?? '未知访客'}</strong>
                  <span>状态：{sessionDetail.status}</span>
                  <span>轮次：{sessionDetail.turnCount} / 20</span>
                  {sessionDetail.interimSummary ? <span>第 10 轮总结：{sessionDetail.interimSummary.summary}</span> : null}
                  {sessionDetail.finalSummary ? <span>第 20 轮总结：{sessionDetail.finalSummary.summary}</span> : null}
                </div>
                <div className="grid gap-3">
                  {(sessionDetail.messages ?? []).map((message) => (
                    <div className="rounded-2xl border border-zinc-200/80 p-3 text-sm leading-6 dark:border-zinc-800" key={message.id}>
                      <strong className="block text-zinc-950 dark:text-white">{message.role}</strong>
                      <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-200">{message.content}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
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
                <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">确认删除 useKey？</h3>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  将删除此 useKey 及其关联的所有会话记录和聊天消息，该访客再次进入 AI 对话需重新认领 IP。
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

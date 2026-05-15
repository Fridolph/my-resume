'use client'

import { useRequest } from 'alova/client'
import {
  createFetchAiChatLeadsMethod,
  createFetchAiChatSessionDetailMethod,
  createFetchAiChatSessionsMethod,
  createFetchAiChatUseKeysMethod,
  createIssueAiChatUseKeyMethod,
  createRevokeAiChatUseKeyMethod,
} from '@my-resume/api-client'
import { Button, Card, CardContent, CardHeader, CardTitle, Chip, Table } from '@heroui/react'
import { useState } from 'react'

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

export function ChatGovernanceShell() {
  const { accessToken, status } = useAdminSession()
  const [sessionDetailId, setSessionDetailId] = useState<string | null>(null)
  const [issuingLeadId, setIssuingLeadId] = useState<string | null>(null)
  const [revokingUseKey, setRevokingUseKey] = useState<string | null>(null)
  const leadsRequest = useRequest(
    () =>
      createFetchAiChatLeadsMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
      }),
    { immediate: status === 'ready' && Boolean(accessToken), force: true },
  )
  const useKeysRequest = useRequest(
    () =>
      createFetchAiChatUseKeysMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
      }),
    { immediate: status === 'ready' && Boolean(accessToken), force: true },
  )
  const sessionsRequest = useRequest(
    () =>
      createFetchAiChatSessionsMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
      }),
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

  async function refreshAll() {
    await Promise.all([
      leadsRequest.send(),
      useKeysRequest.send(),
      sessionsRequest.send(),
    ])
  }

  async function issueUseKey(leadId: string) {
    setIssuingLeadId(leadId)

    try {
      await createIssueAiChatUseKeyMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        leadId,
      }).send()
      await refreshAll()
    } finally {
      setIssuingLeadId(null)
    }
  }

  async function revokeUseKey(useKey: string) {
    setRevokingUseKey(useKey)

    try {
      await createRevokeAiChatUseKeyMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        useKey,
      }).send()
      await refreshAll()
    } finally {
      setRevokingUseKey(null)
    }
  }

  async function openSessionDetail(sessionId: string) {
    setSessionDetailId(sessionId)
    await sessionDetailRequest.send()
  }

  return (
    <div className="stack">
      <Card>
        <CardHeader className="grid gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm" variant="soft">公开站 AI Chat</Chip>
            <Chip size="sm" variant="soft">Lead / useKey / Session</Chip>
          </div>
          <div className="grid gap-2">
            <CardTitle className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              AI Chat 治理台
            </CardTitle>
            <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              这里收口公开站 AI Chat 的最小闭环：查看访客线索、发放或作废 useKey、回看多轮会话以及第 10 / 20 轮总结。
            </p>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">访客线索</CardTitle>
        </CardHeader>
        <CardContent>
          <Table variant="secondary">
            <Table.Header>
              <Table.Column isRowHeader>访客</Table.Column>
              <Table.Column>留言</Table.Column>
              <Table.Column>状态</Table.Column>
              <Table.Column>时间</Table.Column>
              <Table.Column>操作</Table.Column>
            </Table.Header>
            <Table.Body items={leads}>
              {(lead) => (
                <Table.Row id={lead.id} key={lead.id}>
                  <Table.Cell>
                    <div className="grid gap-1">
                      <strong>{lead.displayName}</strong>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{lead.companyName || lead.contact || '未提供额外信息'}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>{lead.message}</Table.Cell>
                  <Table.Cell>
                    <Chip size="sm" variant="soft">{lead.status}</Chip>
                  </Table.Cell>
                  <Table.Cell>{formatDateTime(lead.createdAt)}</Table.Cell>
                  <Table.Cell>
                    <Button isDisabled={issuingLeadId === lead.id} size="sm" onPress={() => void issueUseKey(lead.id)} variant="primary">
                      {issuingLeadId === lead.id ? '发放中...' : '发放 useKey'}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">useKey 列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table variant="secondary">
            <Table.Header>
              <Table.Column isRowHeader>useKey</Table.Column>
              <Table.Column>状态</Table.Column>
              <Table.Column>已用轮次</Table.Column>
              <Table.Column>创建时间</Table.Column>
              <Table.Column>操作</Table.Column>
            </Table.Header>
            <Table.Body items={useKeys}>
              {(useKey) => (
                <Table.Row id={useKey.id} key={useKey.id}>
                  <Table.Cell><strong>{useKey.useKey}</strong></Table.Cell>
                  <Table.Cell><Chip size="sm" variant="soft">{useKey.status}</Chip></Table.Cell>
                  <Table.Cell>{useKey.usedTurns} / {useKey.maxTurns}</Table.Cell>
                  <Table.Cell>{formatDateTime(useKey.createdAt)}</Table.Cell>
                  <Table.Cell>
                    <Button isDisabled={revokingUseKey === useKey.useKey} size="sm" variant="danger-soft" onPress={() => void revokeUseKey(useKey.useKey)}>
                      {revokingUseKey === useKey.useKey ? '作废中...' : '作废'}
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-zinc-950 dark:text-white">会话列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table variant="secondary">
            <Table.Header>
              <Table.Column isRowHeader>访客</Table.Column>
              <Table.Column>状态</Table.Column>
              <Table.Column>轮次</Table.Column>
              <Table.Column>最后更新时间</Table.Column>
              <Table.Column>操作</Table.Column>
            </Table.Header>
            <Table.Body items={sessions}>
              {(session) => (
                <Table.Row id={session.id} key={session.id}>
                  <Table.Cell>
                    <div className="grid gap-1">
                      <strong>{session.leadDisplayName}</strong>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">{session.companyName || session.locale}</span>
                    </div>
                  </Table.Cell>
                  <Table.Cell><Chip size="sm" variant="soft">{session.status}</Chip></Table.Cell>
                  <Table.Cell>{session.turnCount} / 20</Table.Cell>
                  <Table.Cell>{formatDateTime(session.updatedAt)}</Table.Cell>
                  <Table.Cell>
                    <Button size="sm" variant="ghost" onPress={() => void openSessionDetail(session.id)}>
                      查看详情
                    </Button>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </CardContent>
      </Card>

      <AdminDrawerShell dialogClassName="w-full max-w-3xl" isOpen={Boolean(sessionDetailId)} onClose={() => setSessionDetailId(null)}>
        <div className="grid min-h-[20rem] gap-3">
          <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">会话详情</h2>
          </div>
          <div className="grid gap-4 px-4 py-3">
            {sessionDetailRequest.loading ? <p>加载中...</p> : null}
            {sessionDetail ? (
              <>
                <div className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-50/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                  <strong>{sessionDetail.lead.displayName}</strong>
                  <span>状态：{sessionDetail.status}</span>
                  <span>轮次：{sessionDetail.turnCount} / 20</span>
                  {sessionDetail.interimSummary ? <span>第 10 轮总结：{sessionDetail.interimSummary.summary}</span> : null}
                  {sessionDetail.finalSummary ? <span>第 20 轮总结：{sessionDetail.finalSummary.summary}</span> : null}
                </div>
                <div className="grid gap-3">
                  {sessionDetail.messages.map((message: AiChatSession['messages'][number]) => (
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
    </div>
  )
}

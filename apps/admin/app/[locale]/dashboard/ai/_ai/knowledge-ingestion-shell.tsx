'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import Link from 'next/link'
import { useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { AiUserDocIngestionPanel } from './components/user-doc-ingestion-panel'
import type { UserDocIngestResult } from './types/ai-file.types'

export function KnowledgeIngestionShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const [latestResult, setLatestResult] = useState<UserDocIngestResult | null>(null)

  if (status !== 'ready' || !currentUser || !accessToken) {
    return null
  }

  const canUpload = Boolean(currentUser.capabilities.canTriggerAiAnalysis)

  return (
    <div className="stack">
      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">当前角色：{currentUser.role}</Chip>
            <Chip size="sm">RAG 资料入库</Chip>
          </div>
          <div className="space-y-2">
            <p className="eyebrow">knowledge base</p>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              RAG 资料入库
            </CardTitle>
            <CardDescription className="max-w-3xl leading-7">
              这里专门处理 user_docs
              上传、作用域选择和检索态切块写入。它不负责简历草稿回填，也不会自动发布内容。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="stack">
          <div className="dashboard-entry-actions">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href="/dashboard/ai">
              返回 AI 工作台
            </Link>
          </div>

          {latestResult ? (
            <div className="status-box">
              <strong>最近入库</strong>
              <span>
                {latestResult.fileName} · {latestResult.sourceScope} · 切块{' '}
                {latestResult.chunkCount} 条
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AiUserDocIngestionPanel
        accessToken={accessToken}
        apiBaseUrl={DEFAULT_API_BASE_URL}
        canUpload={canUpload}
        onIngested={setLatestResult}
      />
    </div>
  )
}

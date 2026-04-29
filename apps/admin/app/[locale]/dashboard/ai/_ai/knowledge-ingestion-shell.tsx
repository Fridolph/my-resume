'use client'

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
  const moduleShellClass =
    'border-b border-zinc-200/80 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5 sm:py-6 lg:px-6'
  const moduleHeaderClass = 'grid gap-2'

  return (
    <div className="bg-[#ebebee] dark:bg-zinc-950">
      <section className={moduleShellClass}>
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">当前角色：{currentUser.role}</Chip>
            <Chip size="sm">RAG 资料入库</Chip>
          </div>
          <div className={moduleHeaderClass}>
            <p className="eyebrow">knowledge base</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              RAG 资料入库
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              这里专门处理 user_docs
              上传、作用域选择和检索态切块写入。它不负责简历草稿回填，也不会自动发布内容。
            </p>
          </div>
          <div className="dashboard-entry-actions">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href="/dashboard/ai">
              返回 AI 工作台
            </Link>
          </div>

          {latestResult ? (
            <div className="status-box bg-white dark:bg-zinc-900">
              <strong>最近入库</strong>
              <span>
                {latestResult.fileName} · {latestResult.sourceScope} · 切块{' '}
                {latestResult.chunkCount} 条
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className={moduleShellClass}>
        <div className={moduleHeaderClass}>
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
            上传并写入 user_docs 检索态
          </h2>
          <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            这里维持最小上传入口：单文件、单作用域、即时返回切块结果，先把资料入库链路打磨稳定。
          </p>
        </div>

        <AiUserDocIngestionPanel
          accessToken={accessToken}
          apiBaseUrl={DEFAULT_API_BASE_URL}
          canUpload={canUpload}
          onIngested={setLatestResult}
        />
      </section>
    </div>
  )
}

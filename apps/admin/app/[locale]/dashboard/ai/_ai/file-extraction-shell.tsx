'use client'

import { Chip } from '@heroui/react/chip'
import Link from 'next/link'
import { useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { AiFileExtractionPanel } from './components/file-extraction-panel'
import type { FileExtractionResult } from './types/ai-file.types'

export function FileExtractionShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const [latestResult, setLatestResult] = useState<FileExtractionResult | null>(null)

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
            <Chip size="sm">文件提取诊断</Chip>
          </div>
          <div className={moduleHeaderClass}>
            <p className="eyebrow">file extraction</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              文件提取诊断
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              这里只验证上传文件能否被解析成文本，适合排查文件边界、解析质量和后续 AI
              输入质量。
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
              <strong>最近提取</strong>
              <span>
                {latestResult.fileName} · {latestResult.fileType} ·{' '}
                {latestResult.charCount} 字符
              </span>
            </div>
          ) : null}
        </div>
      </section>

      <section className={moduleShellClass}>
        <div className={moduleHeaderClass}>
          <h2 className="text-[1.75rem] font-semibold tracking-tight text-zinc-950 dark:text-white">
            上传并预览提取结果
          </h2>
          <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            这里单独验证 TXT / Markdown / PDF / DOCX 的提取质量，先把上传输入链路看清楚，再决定后续 AI 如何消费。
          </p>
        </div>

        <AiFileExtractionPanel
          accessToken={accessToken}
          apiBaseUrl={DEFAULT_API_BASE_URL}
          canUpload={canUpload}
          onExtractedText={setLatestResult}
        />
      </section>
    </div>
  )
}

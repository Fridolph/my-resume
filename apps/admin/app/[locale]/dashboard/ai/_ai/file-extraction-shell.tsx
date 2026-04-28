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

import { AiFileExtractionPanel } from './components/file-extraction-panel'
import type { FileExtractionResult } from './types/ai-file.types'

export function FileExtractionShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const [latestResult, setLatestResult] = useState<FileExtractionResult | null>(null)

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
            <Chip size="sm">文件提取诊断</Chip>
          </div>
          <div className="space-y-2">
            <p className="eyebrow">file extraction</p>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              文件提取诊断
            </CardTitle>
            <CardDescription className="max-w-3xl leading-7">
              这里只验证上传文件能否被解析成文本，适合排查文件边界、解析质量和后续 AI
              输入质量。
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
              <strong>最近提取</strong>
              <span>
                {latestResult.fileName} · {latestResult.fileType} ·{' '}
                {latestResult.charCount} 字符
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <AiFileExtractionPanel
        accessToken={accessToken}
        apiBaseUrl={DEFAULT_API_BASE_URL}
        canUpload={canUpload}
        onExtractedText={setLatestResult}
      />
    </div>
  )
}

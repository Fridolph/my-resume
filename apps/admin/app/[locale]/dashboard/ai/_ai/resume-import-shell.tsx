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

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { ResumeImportPanel } from './components/resume-import-panel'

export function ResumeImportShell({ locale: _locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()

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
            <Chip size="sm">异步识别</Chip>
          </div>
          <div className="space-y-2">
            <p className="eyebrow">resume import</p>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              简历导入识别
            </CardTitle>
            <CardDescription className="max-w-3xl leading-7">
              这里专门处理“上传已有中文简历 → AI 识别候选草稿 → 进入 diff 看台 →
              按模块回填草稿”。上传后会显示阶段时间线，失败时保留可读错误与 traceId。
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
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href="/dashboard/resume">
              前往简历编辑
            </Link>
          </div>

          <ResumeImportPanel
            accessToken={accessToken}
            apiBaseUrl={DEFAULT_API_BASE_URL}
            canUpload={canUpload}
          />
        </CardContent>
      </Card>
    </div>
  )
}

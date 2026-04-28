'use client'

import { useRequest } from 'alova/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Button } from '@heroui/react/button'
import { Chip } from '@heroui/react/chip'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { adminPrimaryButtonClass } from '@core/button-styles'
import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { createFetchDraftResumeSummaryMethod } from '../../resume/_resume/services/resume-draft-api'
import type {
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
} from '../../resume/_resume/types/resume.types'
import { buildDraftSummarySnapshot } from '../../resume/_resume/utils/resume-summary'
import { readResumeLocaleCookie } from '../../resume/_resume/utils/resume-locale'
import { AiAnalysisPanel } from './components/analysis-panel'
import { createFetchAiWorkbenchRuntimeMethod } from './services/ai-workbench-api'
import type { AiResumeOptimizationResult } from './types/ai-workbench.types'
import {
  DEFAULT_RESUME_OPTIMIZATION_TEMPLATE,
  readResumeOptimizationContent,
  upsertResumeOptimizationHistoryEntry,
  writeResumeOptimizationContent,
} from './utils/resume-optimization-persistence'

export function ResumeOptimizationShell({ locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const summaryLocale = readResumeLocaleCookie() ?? locale
  const [analysisContent, setAnalysisContent] = useState(
    DEFAULT_RESUME_OPTIMIZATION_TEMPLATE,
  )
  const [analysisHelperMessage, setAnalysisHelperMessage] = useState<string | null>(null)
  const [draftSnapshot, setDraftSnapshot] = useState<ResumeDraftSummarySnapshot | null>(
    null,
  )
  const {
    data: runtimeSummary,
    error: runtimeError,
    loading: runtimeLoading,
    send: loadRuntimeSummary,
  } = useRequest(
    () =>
      createFetchAiWorkbenchRuntimeMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const {
    data: loadedDraftSnapshot,
    error: draftSnapshotError,
    loading: draftSnapshotLoading,
    send: loadDraftSnapshot,
  } = useRequest(
    () =>
      createFetchDraftResumeSummaryMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        locale: summaryLocale,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const loadRuntimeSummaryRef = useRef(loadRuntimeSummary)
  const loadDraftSnapshotRef = useRef(loadDraftSnapshot)
  const runtimeRequestKeyRef = useRef<string | null>(null)
  const draftRequestKeyRef = useRef<string | null>(null)
  const runtimeRequestKey =
    status === 'ready' && accessToken ? `${status}:${accessToken}` : null
  const draftRequestKey =
    status === 'ready' && accessToken && currentUser?.capabilities.canEditResume
      ? `${status}:${accessToken}:${summaryLocale}`
      : null

  useEffect(() => {
    loadRuntimeSummaryRef.current = loadRuntimeSummary
  }, [loadRuntimeSummary])

  useEffect(() => {
    loadDraftSnapshotRef.current = loadDraftSnapshot
  }, [loadDraftSnapshot])

  useEffect(() => {
    if (!runtimeRequestKey) {
      runtimeRequestKeyRef.current = null
      return
    }

    if (runtimeRequestKeyRef.current === runtimeRequestKey) {
      return
    }

    runtimeRequestKeyRef.current = runtimeRequestKey
    void loadRuntimeSummaryRef.current().catch(() => undefined)
  }, [runtimeRequestKey])

  useEffect(() => {
    if (!draftRequestKey) {
      draftRequestKeyRef.current = null
      return
    }

    if (draftRequestKeyRef.current === draftRequestKey) {
      return
    }

    draftRequestKeyRef.current = draftRequestKey
    void loadDraftSnapshotRef.current().catch(() => undefined)
  }, [draftRequestKey])

  useEffect(() => {
    if (loadedDraftSnapshot) {
      setDraftSnapshot(loadedDraftSnapshot)
    }
  }, [loadedDraftSnapshot])

  useEffect(() => {
    setAnalysisContent(readResumeOptimizationContent())
  }, [])

  if (status !== 'ready' || !currentUser || !accessToken) {
    return null
  }

  const isAdmin = Boolean(currentUser.capabilities.canTriggerAiAnalysis)
  const helperMessage =
    analysisHelperMessage ??
    (draftSnapshotError
      ? '当前草稿快照读取失败，可稍后重试；已保留手动输入优化要求的能力。'
      : null)

  function handleAnalysisContentChange(nextContent: string) {
    setAnalysisContent(nextContent)
    writeResumeOptimizationContent(nextContent)

    if (analysisHelperMessage) {
      setAnalysisHelperMessage(null)
    }
  }

  function handleResetToDefaultTemplate() {
    setAnalysisContent(DEFAULT_RESUME_OPTIMIZATION_TEMPLATE)
    writeResumeOptimizationContent(DEFAULT_RESUME_OPTIMIZATION_TEMPLATE)
    setAnalysisHelperMessage('已恢复默认高级全栈 JD 模板，可直接继续修改后发起分析。')
  }

  function handleOptimizationGenerated(
    result: AiResumeOptimizationResult,
    instruction: string,
  ) {
    upsertResumeOptimizationHistoryEntry(result, instruction)
  }

  function handleDraftApplied(snapshot: ResumeDraftSnapshot) {
    setDraftSnapshot(
      buildDraftSummarySnapshot(
        snapshot,
        summaryLocale ?? snapshot.resume.meta.defaultLocale,
      ),
    )
    setAnalysisHelperMessage('当前草稿快照已刷新，可直接确认 AI 改写结果。')
  }

  return (
    <div className="stack">
      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">当前角色：{currentUser.role}</Chip>
            <Chip size="sm">简历针对性分析</Chip>
          </div>
          <div className="space-y-2">
            <p className="eyebrow">resume optimization</p>
            <CardTitle className="text-3xl font-semibold tracking-tight">
              简历针对性分析
            </CardTitle>
            <CardDescription className="max-w-3xl leading-7">
              这里专门处理“读取当前草稿 → 输入 JD / 优化要求 → 生成结构化建议 →
              进入结果页按模块回填”。它和“上传识别已有简历”分开，避免导入与优化职责混在一起。
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="stack">
          <div className="dashboard-badge-row">
            <Chip>当前 Provider：{runtimeSummary?.provider ?? '加载中'}</Chip>
            <Chip>当前模型：{runtimeSummary?.model ?? '加载中'}</Chip>
            <Chip>运行模式：{runtimeSummary?.mode ?? '加载中'}</Chip>
          </div>

          {runtimeError ? (
            <p className="error-text">运行时摘要加载失败：{runtimeError.message}</p>
          ) : null}
          {runtimeLoading ? <p className="muted">正在加载 AI 运行时摘要...</p> : null}
          {draftSnapshotLoading ? <p className="muted">正在读取当前草稿快照...</p> : null}

          <div className="dashboard-entry-actions">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href="/dashboard/ai">
              返回 AI 工作台
            </Link>
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href="/dashboard/ai/optimization-history">
              查看优化记录
            </Link>
          </div>
        </CardContent>
      </Card>

      {runtimeSummary ? (
        <AiAnalysisPanel
          accessToken={accessToken}
          apiBaseUrl={DEFAULT_API_BASE_URL}
          canAnalyze={isAdmin}
          content={analysisContent}
          draftSnapshot={draftSnapshot}
          helperMessage={helperMessage}
          inputAccessory={
            <div className="grid gap-3">
              <div className="status-box">
                <strong>模块边界</strong>
                <span>
                  本页只做当前草稿的针对性分析；如果要从已有简历生成候选草稿，请回到“简历导入识别”。
                </span>
              </div>
              <div className="dashboard-entry-actions">
                <Button
                  className={adminPrimaryButtonClass}
                  onPress={handleResetToDefaultTemplate}
                  size="sm"
                  type="button"
                  variant="outline">
                  恢复默认 JD 模板
                </Button>
              </div>
            </div>
          }
          onContentChange={handleAnalysisContentChange}
          onDraftApplied={handleDraftApplied}
          onOptimizationGenerated={handleOptimizationGenerated}
          runtimeSummary={runtimeSummary}
        />
      ) : null}
    </div>
  )
}

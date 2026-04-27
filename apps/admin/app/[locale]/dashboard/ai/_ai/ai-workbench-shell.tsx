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
import { Skeleton } from '@heroui/react/skeleton'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { readResumeLocaleCookie } from '../../resume/_resume/utils/resume-locale'
import { buildDraftSummarySnapshot } from '../../resume/_resume/utils/resume-summary'
import { createFetchDraftResumeSummaryMethod } from '../../resume/_resume/services/resume-draft-api'
import type {
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
} from '../../resume/_resume/types/resume.types'
import { CompactWorkbenchInfoCards } from './components/compact-workbench-info-cards'
import { createFetchAiWorkbenchRuntimeMethod } from './services/ai-workbench-api'
import type { FileExtractionResult } from './types/ai-file.types'
import type { UserDocIngestResult } from './types/ai-file.types'
import type {
  AiResumeOptimizationResult,
  AiWorkbenchScenario,
} from './types/ai-workbench.types'
import {
  DEFAULT_RESUME_OPTIMIZATION_TEMPLATE,
  readResumeOptimizationContent,
  upsertResumeOptimizationHistoryEntry,
  writeResumeOptimizationContent,
} from './utils/resume-optimization-persistence'

const AiFileExtractionPanel = dynamic(
  () => import('./components/file-extraction-panel').then((module) => module.AiFileExtractionPanel),
  {
    loading: () => (
      <div className="status-box" data-testid="ai-file-extraction-loading">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">正在加载文件提取面板...</p>
        <div className="mt-2 grid gap-2">
          <Skeleton className="h-4 w-4/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-4 w-2/3 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      </div>
    ),
  },
)

const AiAnalysisPanel = dynamic(
  () => import('./components/analysis-panel').then((module) => module.AiAnalysisPanel),
  {
    loading: () => (
      <div className="status-box" data-testid="ai-analysis-panel-loading">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">正在加载分析面板...</p>
        <div className="mt-2 grid gap-2">
          <Skeleton className="h-4 w-3/4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-4 w-4/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      </div>
    ),
  },
)

const AiUserDocIngestionPanel = dynamic(
  () =>
    import('./components/user-doc-ingestion-panel').then(
      (module) => module.AiUserDocIngestionPanel,
    ),
  {
    loading: () => (
      <div className="status-box" data-testid="ai-user-doc-ingestion-loading">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">正在加载资料入库面板...</p>
        <div className="mt-2 grid gap-2">
          <Skeleton className="h-4 w-3/4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-4 w-2/3 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      </div>
    ),
  },
)

const scenarioCards = {
  'jd-match': {
    title: 'JD 匹配分析',
    description: '根据岗位描述评估当前简历匹配度，帮助快速看出缺口与调整方向。',
  },
  'resume-review': {
    title: '简历优化建议',
    description: '直接基于后台当前草稿生成结构化建议与 diff，再由用户决定是否应用到草稿。',
  },
  'offer-compare': {
    title: 'Offer 对比建议',
    description: '对比多个机会的成长性、匹配度与风险，帮助做更稳妥的取舍。',
  },
} as const

export function AdminAiWorkbenchShell({ locale }: { locale: AppLocale }) {
  const { accessToken, currentUser, status } = useAdminSession()
  const t = useTranslations('ai')
  const summaryLocale = readResumeLocaleCookie() ?? locale
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
  const [analysisContent, setAnalysisContent] = useState(
    DEFAULT_RESUME_OPTIMIZATION_TEMPLATE,
  )
  const [analysisHelperMessage, setAnalysisHelperMessage] = useState<string | null>(null)
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
  const [draftSnapshot, setDraftSnapshot] = useState<ResumeDraftSummarySnapshot | null>(
    null,
  )
  const [draftSnapshotMessage, setDraftSnapshotMessage] = useState<string | null>(null)
  const loadRuntimeSummaryRef = useRef(loadRuntimeSummary)
  const loadDraftSnapshotRef = useRef(loadDraftSnapshot)
  const runtimeRequestKeyRef = useRef<string | null>(null)
  const draftRequestKeyRef = useRef<string | null>(null)
  const runtimeRequestKey = status === 'ready' && accessToken ? `${status}:${accessToken}` : null
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
    setDraftSnapshotMessage(null)
    void loadDraftSnapshotRef.current().catch(() => undefined)
  }, [draftRequestKey])

  useEffect(() => {
    if (!loadedDraftSnapshot) {
      return
    }

    setDraftSnapshot(loadedDraftSnapshot)
  }, [loadedDraftSnapshot])

  useEffect(() => {
    setAnalysisContent(readResumeOptimizationContent())
  }, [])

  const isAdmin = Boolean(currentUser?.capabilities.canTriggerAiAnalysis)
  const roleMessage = isAdmin
    ? '当前账号可直接分析当前草稿、查看 diff，并按模块写回后台草稿。'
    : 'viewer 当前只允许查看缓存结果与预设体验，不能分析当前草稿或触发新的真实分析。'

  function handleExtractedText(result: FileExtractionResult) {
    setAnalysisContent(result.text)
    setAnalysisHelperMessage(
      `已将 ${result.fileName} 的提取结果同步到优化要求输入区，可直接整理后分析当前草稿。`,
    )
  }

  function handleUserDocIngested(result: UserDocIngestResult) {
    setAnalysisHelperMessage(
      `已将 ${result.fileName} 写入 ${result.sourceScope} 检索态，切块 ${result.chunkCount} 条。`,
    )
  }

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
    setDraftSnapshotMessage('当前草稿快照已刷新，可直接确认 AI 改写结果。')
  }

  const scenarioEntries = useMemo(
    () =>
      runtimeSummary?.supportedScenarios.map((scenario: AiWorkbenchScenario) => ({
        scenario,
        ...scenarioCards[scenario],
      })) ?? [],
    [runtimeSummary],
  )

  if (status !== 'ready' || !currentUser) {
    return null
  }

  return (
    <div className="stack">
      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-3">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">当前角色：{currentUser.role}</Chip>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl font-semibold tracking-tight">
              {t('pageTitle')}
            </CardTitle>
            <CardDescription className="max-w-3xl leading-7">
              {t('pageDescription')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="stack">
          <div className="dashboard-badge-row">
            <Chip>当前 Provider：{runtimeSummary?.provider ?? '加载中'}</Chip>
            <Chip>当前模型：{runtimeSummary?.model ?? '加载中'}</Chip>
            <Chip>运行模式：{runtimeSummary?.mode ?? '加载中'}</Chip>
          </div>

          <div className="dashboard-entry-actions">
            <Link
              className="inline-flex h-10 items-center justify-center rounded-full border border-zinc-300 px-4 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:text-white"
              href="/dashboard/ai/optimization-history">
              进入优化记录
            </Link>
          </div>

          {isAdmin ? (
            <div className="status-box">{roleMessage}</div>
          ) : (
            <div className="readonly-box">{roleMessage}</div>
          )}

          <CompactWorkbenchInfoCards
            canEditResume={Boolean(currentUser.capabilities.canEditResume)}
            draftSnapshot={draftSnapshot}
            draftSnapshotError={draftSnapshotError}
            draftSnapshotLoading={draftSnapshotLoading}
            draftSnapshotMessage={draftSnapshotMessage}
            onReloadDraftSnapshot={() => void loadDraftSnapshot()}
            onReloadRuntimeSummary={() => void loadRuntimeSummary()}
            runtimeError={runtimeError}
            runtimeLoading={runtimeLoading}
            runtimeSummary={runtimeSummary}
          />
        </CardContent>
      </Card>

      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="eyebrow">场景规划</p>
          <CardTitle>支持的分析场景</CardTitle>
          <CardDescription>
            当前先把分析场景收束成固定三类，既方便教学，也方便保证输出结构稳定。
          </CardDescription>
        </CardHeader>
        <CardContent className="stack">
          {scenarioEntries.length === 0 ? (
            <p className="muted">场景信息将在运行时摘要加载后显示。</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {scenarioEntries.map((entry: (typeof scenarioEntries)[number]) => (
                <div className="status-box" key={entry.scenario}>
                  <strong>{entry.title}</strong>
                  <span>{entry.description}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {accessToken && runtimeSummary ? (
        <AiAnalysisPanel
          accessToken={accessToken}
          apiBaseUrl={DEFAULT_API_BASE_URL}
          canAnalyze={isAdmin}
          content={analysisContent}
          draftSnapshot={draftSnapshot}
          helperMessage={analysisHelperMessage}
          inputAccessory={
            <div className="grid gap-3">
              <AiUserDocIngestionPanel
                accessToken={accessToken}
                apiBaseUrl={DEFAULT_API_BASE_URL}
                canUpload={isAdmin}
                onIngested={handleUserDocIngested}
              />
              <AiFileExtractionPanel
                accessToken={accessToken}
                apiBaseUrl={DEFAULT_API_BASE_URL}
                canUpload={isAdmin}
                onExtractedText={handleExtractedText}
              />
              <div className="dashboard-entry-actions">
                <Button onPress={handleResetToDefaultTemplate} size="sm" variant="outline">
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

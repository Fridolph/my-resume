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
import { createFetchAiWorkbenchRuntimeMethod } from './services/ai-workbench-api'
import type { FileExtractionResult } from './types/ai-file.types'
import type { AiWorkbenchScenario } from './types/ai-workbench.types'

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

const AiCachedReportsPanel = dynamic(
  () => import('./components/cached-reports-panel').then((module) => module.AiCachedReportsPanel),
  {
    loading: () => (
      <div className="status-box" data-testid="ai-cached-reports-loading">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">正在加载缓存报告...</p>
        <div className="mt-2 grid gap-2">
          <Skeleton className="h-4 w-3/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
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

function WorkbenchSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="grid gap-2" data-testid="workbench-skeleton">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          className="h-4 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80"
          key={`workbench-skeleton-${index}`}
        />
      ))}
    </div>
  )
}

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
  const [analysisContent, setAnalysisContent] = useState('')
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

  const isAdmin = Boolean(currentUser?.capabilities.canTriggerAiAnalysis)
  const roleMessage = isAdmin
    ? '当前账号可直接分析当前草稿、查看 diff，并按模块写回后台草稿。'
    : 'viewer 当前只允许查看缓存结果与预设体验，不能分析当前草稿或触发新的真实分析。'

  const cachedReportsPanel = accessToken ? (
    <AiCachedReportsPanel
      accessToken={accessToken}
      apiBaseUrl={DEFAULT_API_BASE_URL}
      isViewerExperience={!isAdmin}
    />
  ) : null

  function handleExtractedText(result: FileExtractionResult) {
    setAnalysisContent(result.text)
    setAnalysisHelperMessage(
      `已将 ${result.fileName} 的提取结果同步到优化要求输入区，可直接整理后分析当前草稿。`,
    )
  }

  function handleAnalysisContentChange(nextContent: string) {
    setAnalysisContent(nextContent)

    if (analysisHelperMessage) {
      setAnalysisHelperMessage(null)
    }
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

          {isAdmin ? (
            <div className="status-box">{roleMessage}</div>
          ) : (
            <div className="readonly-box">{roleMessage}</div>
          )}

          {runtimeLoading ? <WorkbenchSkeleton /> : null}
          {runtimeError ? (
            <div className="grid gap-3">
              <p className="error-text">{runtimeError.message}</p>
              <Button
                className="w-fit"
                onPress={() => void loadRuntimeSummary()}
                size="sm"
                variant="secondary">
                重试运行时读取
              </Button>
            </div>
          ) : null}
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
            <AiFileExtractionPanel
              accessToken={accessToken}
              apiBaseUrl={DEFAULT_API_BASE_URL}
              canUpload={isAdmin}
              onExtractedText={handleExtractedText}
            />
          }
          onContentChange={handleAnalysisContentChange}
          onDraftApplied={handleDraftApplied}
          runtimeSummary={runtimeSummary}
        />
      ) : null}

      {cachedReportsPanel}

      {currentUser.capabilities.canEditResume ? (
        <Card className="border border-zinc-200/70 dark:border-zinc-800">
          <CardHeader className="flex flex-col items-start gap-2">
            <p className="eyebrow">草稿反馈</p>
            <CardTitle>当前草稿快照</CardTitle>
            <CardDescription>
              apply 成功后这里会立即刷新，帮助确认当前草稿是否已经接收 AI 建议，而不必马上切回编辑器。
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            {draftSnapshotLoading ? (
              <WorkbenchSkeleton lines={4} />
            ) : null}
            {draftSnapshotError ? (
              <div className="grid gap-3">
                <p className="error-text">{draftSnapshotError.message}</p>
                <Button
                  className="w-fit"
                  onPress={() => void loadDraftSnapshot()}
                  size="sm"
                  variant="secondary">
                  重试草稿快照读取
                </Button>
              </div>
            ) : null}
            {draftSnapshotMessage ? (
              <div className="dashboard-inline-note">{draftSnapshotMessage}</div>
            ) : null}
            {draftSnapshot ? (
              <div className="status-box">
                <strong>{draftSnapshot.resume.profile.headline}</strong>
                <span>{draftSnapshot.resume.profile.summary}</span>
                <span>
                  最近更新时间：
                  {new Date(draftSnapshot.updatedAt).toLocaleString('zh-CN', {
                    hour12: false,
                  })}
                </span>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="eyebrow">运行时摘要</p>
          <CardTitle>Provider 与边界</CardTitle>
          <CardDescription>
            在这轮收口里，AI 页面主路径改成“当前草稿优化”，文件提取和分析报告都作为辅助能力保留。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          <div className="status-box">
            <strong>输入层</strong>
            <span>当前草稿是唯一优化基线；JD、目标岗位和优化要求只负责告诉 AI 应该朝什么方向改。</span>
          </div>
          <div className="status-box">
            <strong>结论层</strong>
            <span>输出同时保留可阅读结论与结构化 diff，既方便理解原因，也方便后续按模块应用。</span>
          </div>
          <div className="status-box">
            <strong>应用层</strong>
            <span>最终是否写回草稿由用户确认，后台继续只应用勾选模块，不做无脑自动覆盖。</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

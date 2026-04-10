'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import dynamic from 'next/dynamic'
import { useEffect, useMemo, useState } from 'react'

import type { AiWorkbenchRuntimeSummary } from './types/ai-workbench.types'
import {
  ensureAiRuntimeSummary,
  ensureDraftResumeSummary,
  invalidateDraftResumeResources,
} from '../../core/admin-resource-store'
import { DEFAULT_API_BASE_URL } from '../../core/env'
import { readResumeLocaleCookie } from '../resume/utils/resume-locale'
import { buildDraftSummarySnapshot } from '../resume/utils/resume-summary'
import type {
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
} from '../resume/types/resume.types'
import { useAdminSession } from '../../core/admin-session'
import type { FileExtractionResult } from './types/ai-file.types'

const AiFileExtractionPanel = dynamic(
  () => import('./components/file-extraction-panel').then((module) => module.AiFileExtractionPanel),
  {
    loading: () => <div className="status-box">正在加载文件提取面板...</div>,
  },
)

const AiAnalysisPanel = dynamic(
  () => import('./components/analysis-panel').then((module) => module.AiAnalysisPanel),
  {
    loading: () => <div className="status-box">正在加载分析面板...</div>,
  },
)

const AiCachedReportsPanel = dynamic(
  () => import('./components/cached-reports-panel').then((module) => module.AiCachedReportsPanel),
  {
    loading: () => <div className="status-box">正在加载缓存报告...</div>,
  },
)

const scenarioCards = {
  'jd-match': {
    title: 'JD 匹配分析',
    description: '根据岗位描述评估当前简历匹配度，帮助快速看出缺口与调整方向。',
  },
  'resume-review': {
    title: '简历优化建议',
    description: '围绕当前标准简历输出结构化建议，再由用户决定是否应用到草稿。',
  },
  'offer-compare': {
    title: 'Offer 对比建议',
    description: '对比多个机会的成长性、匹配度与风险，帮助做更稳妥的取舍。',
  },
} as const

export function AdminAiWorkbenchShell() {
  const { accessToken, currentUser, status } = useAdminSession()
  const summaryLocale = readResumeLocaleCookie()
  const [runtimeSummary, setRuntimeSummary] = useState<AiWorkbenchRuntimeSummary | null>(
    null,
  )
  const [runtimeState, setRuntimeState] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle')
  const [runtimeMessage, setRuntimeMessage] = useState<string | null>(null)
  const [analysisContent, setAnalysisContent] = useState('')
  const [analysisHelperMessage, setAnalysisHelperMessage] = useState<string | null>(null)
  const [draftSnapshot, setDraftSnapshot] = useState<ResumeDraftSummarySnapshot | null>(
    null,
  )
  const [draftSnapshotStatus, setDraftSnapshotStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle')
  const [draftSnapshotMessage, setDraftSnapshotMessage] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'ready' || !accessToken) {
      return
    }

    let cancelled = false
    setRuntimeState('loading')
    setRuntimeMessage(null)

    ensureAiRuntimeSummary({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
    })
      .then((runtime) => {
        if (cancelled) {
          return
        }

        setRuntimeSummary(runtime)
        setRuntimeState('ready')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setRuntimeSummary(null)
        setRuntimeState('error')
        setRuntimeMessage(
          error instanceof Error ? error.message : 'AI 工作台运行时信息加载失败',
        )
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, status])

  useEffect(() => {
    if (status !== 'ready' || !accessToken || !currentUser?.capabilities.canEditResume) {
      return
    }

    let cancelled = false
    setDraftSnapshotStatus('loading')
    setDraftSnapshotMessage(null)

    ensureDraftResumeSummary({
      apiBaseUrl: DEFAULT_API_BASE_URL,
      accessToken,
      locale: summaryLocale,
    })
      .then((snapshot) => {
        if (cancelled) {
          return
        }

        setDraftSnapshot(snapshot)
        setDraftSnapshotStatus('ready')
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        setDraftSnapshot(null)
        setDraftSnapshotStatus('error')
        setDraftSnapshotMessage(
          error instanceof Error ? error.message : '草稿快照读取失败，请稍后重试',
        )
      })

    return () => {
      cancelled = true
    }
  }, [accessToken, currentUser?.capabilities.canEditResume, status, summaryLocale])

  const isAdmin = Boolean(currentUser?.capabilities.canTriggerAiAnalysis)
  const roleMessage = isAdmin
    ? '当前账号可继续接入上传、真实分析和结果阅读。'
    : 'viewer 当前只允许查看缓存结果与预设体验，不能上传文件或触发真实分析。'

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
      `已将 ${result.fileName} 的提取结果同步到分析输入区，可直接继续编辑或触发分析。`,
    )
  }

  function handleAnalysisContentChange(nextContent: string) {
    setAnalysisContent(nextContent)

    if (analysisHelperMessage) {
      setAnalysisHelperMessage(null)
    }
  }

  function handleDraftApplied(snapshot: ResumeDraftSnapshot) {
    if (accessToken) {
      invalidateDraftResumeResources({
        accessToken,
        apiBaseUrl: DEFAULT_API_BASE_URL,
      })
    }
    setDraftSnapshot(
      buildDraftSummarySnapshot(
        snapshot,
        summaryLocale ?? snapshot.resume.meta.defaultLocale,
      ),
    )
    setDraftSnapshotStatus('ready')
    setDraftSnapshotMessage('当前草稿快照已刷新，可直接确认 AI 改写结果。')
  }

  const scenarioEntries = useMemo(
    () =>
      runtimeSummary?.supportedScenarios.map((scenario) => ({
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
              AI 工作台
            </CardTitle>
            <CardDescription className="max-w-3xl leading-7">
              这一页先把上传、分析、缓存报告、草稿回写与运行时状态整理为稳定工作台。现在布局按“整页分行
              + 中间双栏工作区”收拢，后续再加 RAG、检索链路或更复杂的 prompt
              策略时，也不会破坏后台主线。
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

          {runtimeState === 'loading' ? (
            <p className="muted">正在加载 AI 工作台运行时信息...</p>
          ) : null}
          {runtimeState === 'error' && runtimeMessage ? (
            <p className="error-text">{runtimeMessage}</p>
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
              {scenarioEntries.map((entry) => (
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
              apply 成功后这里会立即刷新，减少在多个后台页面之间来回切换确认的成本。
            </CardDescription>
          </CardHeader>
          <CardContent className="stack">
            {draftSnapshotStatus === 'loading' ? (
              <p className="muted">正在加载当前草稿快照...</p>
            ) : null}
            {draftSnapshotStatus === 'error' && draftSnapshotMessage ? (
              <p className="error-text">{draftSnapshotMessage}</p>
            ) : null}
            {draftSnapshotMessage && draftSnapshotStatus === 'ready' ? (
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
            在这轮 UI 升级里，AI
            页面仍然保持“输入、结论、应用”三层节奏，不去扩成复杂多步流程。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          <div className="status-box">
            <strong>输入层</strong>
            <span>文件提取和手工输入都统一沉淀为分析内容，便于继续做缓存和重试。</span>
          </div>
          <div className="status-box">
            <strong>结论层</strong>
            <span>报告需要既有可读结论，也有结构化理由和建议，避免只给模糊答案。</span>
          </div>
          <div className="status-box">
            <strong>应用层</strong>
            <span>最终是否写回草稿由用户确认，后台不做无脑自动覆盖。</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

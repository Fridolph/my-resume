'use client'

import { useRequest } from 'alova/client'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@heroui/react/card'
import { Chip } from '@heroui/react/chip'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { readResumeLocaleCookie } from '../../resume/_resume/utils/resume-locale'
import { createFetchDraftResumeSummaryMethod } from '../../resume/_resume/services/resume-draft-api'
import type { ResumeDraftSummarySnapshot } from '../../resume/_resume/types/resume.types'
import { CompactWorkbenchInfoCards } from './components/compact-workbench-info-cards'
import { createFetchAiWorkbenchRuntimeMethod } from './services/ai-workbench-api'
import type { AiWorkbenchScenario } from './types/ai-workbench.types'

const scenarioCards = {
  'jd-match': {
    title: 'JD 匹配分析',
    description: '根据岗位描述评估当前简历匹配度，帮助快速看出缺口与调整方向。',
  },
  'resume-review': {
    title: '简历优化建议',
    description:
      '直接基于后台当前草稿生成结构化建议与 diff，再由用户决定是否应用到草稿。',
  },
  'offer-compare': {
    title: 'Offer 对比建议',
    description: '对比多个机会的成长性、匹配度与风险，帮助做更稳妥的取舍。',
  },
} as const

const moduleCards = [
  {
    eyebrow: '入口一',
    title: '简历导入识别',
    description:
      '上传已有中文 md/txt 简历，AI 识别成候选草稿，再通过模块级 diff 回填到 draft。',
    href: '/dashboard/ai/resume-import',
    status: '异步 Job',
    tone: 'from-blue-50 via-white to-sky-50 dark:from-blue-950/30 dark:via-zinc-950 dark:to-slate-950',
  },
  {
    eyebrow: '入口二',
    title: '简历针对性分析',
    description:
      '基于当前草稿与 JD/优化要求生成结构化建议，进入结果页后按模块应用到草稿。',
    href: '/dashboard/ai/resume-optimization',
    status: '核心能力',
    tone: 'from-emerald-50 via-white to-teal-50 dark:from-emerald-950/25 dark:via-zinc-950 dark:to-slate-950',
  },
  {
    eyebrow: '入口三',
    title: 'RAG 管理',
    description:
      '统一管理简历之外的 RAG 知识库：自定义资料补充、文件上传入库、已入库内容增删查改。',
    href: '/dashboard/ai/rag-manage',
    status: 'M25',
    tone: 'from-violet-50 via-white to-indigo-50 dark:from-violet-950/25 dark:via-zinc-950 dark:to-indigo-950/25',
  },
  {
    eyebrow: '工具',
    title: '文件提取诊断',
    description:
      '单独验证 TXT / Markdown / PDF / DOCX 的文本提取结果，方便排查上传与解析边界。',
    href: '/dashboard/ai/file-extraction',
    status: '诊断工具',
    tone: 'from-zinc-50 via-white to-slate-50 dark:from-zinc-900 dark:via-zinc-950 dark:to-slate-950',
  },
  {
    eyebrow: '归档',
    title: 'AI 优化记录',
    description: '回看历史优化结果、关联分析记录与本地缓存，便于复用和撰写开发复盘。',
    href: '/dashboard/ai/optimization-history',
    status: '记录中心',
    tone: 'from-rose-50 via-white to-stone-50 dark:from-rose-950/20 dark:via-zinc-950 dark:to-slate-950',
  },
  {
    eyebrow: '治理',
    title: 'AI Chat 治理台',
    description:
      '查看公开站访客线索、发放 useKey、回看多轮问答会话，以及第 10 / 20 轮总结沉淀。',
    href: '/dashboard/ai/chat-governance',
    status: '最小闭环',
    tone: 'from-violet-50 via-white to-indigo-50 dark:from-violet-950/20 dark:via-zinc-950 dark:to-slate-950',
  },
] as const

function ModuleCard({
  description,
  eyebrow,
  href,
  status,
  title,
  tone,
}: (typeof moduleCards)[number]) {
  return (
    <Link
      className={`group relative min-h-[15rem] overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-br ${tone} p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] outline-none transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_24px_70px_rgba(37,99,235,0.14)] focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:shadow-none dark:hover:border-blue-500/40`}
      href={href}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/70 blur-2xl transition group-hover:scale-125 dark:bg-blue-400/10"
      />
      <div className="relative flex h-full flex-col justify-between gap-8">
        <div className="grid gap-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">
              {eyebrow}
            </span>
            <Chip size="sm" variant="soft">
              {status}
            </Chip>
          </div>
          <div className="grid gap-3">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              {title}
            </h2>
            <p className="text-sm leading-7 text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          </div>
        </div>
        <span className="inline-flex w-fit rounded-full bg-white/80 px-3 py-1 text-sm font-medium text-zinc-800 ring-1 ring-zinc-200 transition group-hover:bg-blue-600 group-hover:text-white group-hover:ring-blue-600 dark:bg-zinc-900/80 dark:text-zinc-100 dark:ring-zinc-800">
          进入子模块
        </span>
      </div>
    </Link>
  )
}

function InfoBlock({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/70 p-4 text-sm leading-7 text-blue-950 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-100">
      {children}
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
  const {
    data: draftSnapshot,
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

  const isAdmin = Boolean(currentUser?.capabilities.canTriggerAiAnalysis)
  const roleMessage = isAdmin
    ? '当前账号可进入各个 AI 子模块：导入识别、针对性分析、RAG 入库与诊断工具。'
    : 'viewer 当前只允许查看缓存结果与预设体验，不能触发上传、识别、分析或写回。'
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
            <Chip size="sm">AI 能力地图</Chip>
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

          <InfoBlock>{roleMessage}</InfoBlock>

          <CompactWorkbenchInfoCards
            canEditResume={Boolean(currentUser.capabilities.canEditResume)}
            draftSnapshot={draftSnapshot as ResumeDraftSummarySnapshot | null | undefined}
            draftSnapshotError={draftSnapshotError}
            draftSnapshotLoading={draftSnapshotLoading}
            draftSnapshotMessage={null}
            onReloadDraftSnapshot={() => void loadDraftSnapshot()}
            onReloadRuntimeSummary={() => void loadRuntimeSummary()}
            runtimeError={runtimeError}
            runtimeLoading={runtimeLoading}
            runtimeSummary={runtimeSummary}
          />
        </CardContent>
      </Card>

      <section
        className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3"
        aria-label="AI 子模块入口">
        {moduleCards.map((entry) => (
          <ModuleCard key={entry.href} {...entry} />
        ))}
      </section>

      <Card className="border border-zinc-200/70 dark:border-zinc-800">
        <CardHeader className="flex flex-col items-start gap-2">
          <p className="eyebrow">场景规划</p>
          <CardTitle>支持的分析场景</CardTitle>
          <CardDescription>
            当前先把分析场景收束成固定三类，具体操作入口已经拆到独立子模块，首页只负责导航与状态总览。
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
    </div>
  )
}

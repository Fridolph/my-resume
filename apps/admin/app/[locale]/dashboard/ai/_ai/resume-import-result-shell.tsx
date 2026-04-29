'use client'

import { useRequest } from 'alova/client'
import { Button, Chip, Skeleton } from '@heroui/react'
import { formatFileSize } from '@my-resume/utils'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { adminPrimaryButtonClass } from '@core/button-styles'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import {
  createApplyAiResumeImportMethod,
  createFetchAiResumeImportResultMethod,
} from './services/ai-workbench-api'
import type {
  AiResumeImportModule,
  AiResumeImportModuleContent,
  AiResumeImportModuleContentItem,
  AiResumeImportResult,
} from './types/ai-workbench.types'

interface ResumeImportResultShellProps {
  locale: AppLocale
  resultId: string
}

function moduleLabel(module: AiResumeImportModule) {
  const moduleMap: Record<AiResumeImportModule, string> = {
    profile: '基本信息',
    education: '教育经历',
    experiences: '工作经历',
    projects: '项目经历',
    skills: '专业技能',
    highlights: '核心竞争力',
  }

  return moduleMap[module]
}

function statusLabel(status: string) {
  const statusMap: Record<string, string> = {
    added: '新增',
    changed: '修改',
    unchanged: '无变化',
    warning: '需确认',
  }

  return statusMap[status] ?? status
}

function safetyFlagLabel(flag: string) {
  const flagMap: Record<string, string> = {
    advertisement: '广告/推广',
    irrelevant: '无关内容',
    prompt_injection: '提示词注入',
    unsafe_markup: '脚本/HTML 风险',
  }

  return flagMap[flag] ?? flag
}

function formatGeneratedAt(createdAt: string, locale: AppLocale) {
  return new Date(createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    day: 'numeric',
  })
}

function fallbackModuleContents(
  result: AiResumeImportResult,
): AiResumeImportModuleContent[] {
  if (result.moduleContents?.length) {
    return result.moduleContents
  }

  return result.moduleDiffs.map((moduleDiff) => ({
    module: moduleDiff.module,
    title: moduleDiff.title,
    warnings: moduleDiff.entries.flatMap((entry) =>
      entry.warning ? [entry.warning] : [],
    ),
    currentItems: moduleDiff.entries.map((entry) => ({
      key: `${entry.key}-current`,
      title: entry.label,
      meta: [],
      body: [entry.currentValue].filter(Boolean),
    })),
    candidateItems: moduleDiff.entries.map((entry) => ({
      key: `${entry.key}-candidate`,
      title: entry.label,
      meta: [],
      body: [entry.suggestedValue].filter(Boolean),
    })),
  }))
}

function MetaList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
      {items.map((metaItem) => (
        <span
          className="inline-flex items-center gap-1 rounded-md bg-zinc-100/70 px-2 py-0.5 dark:bg-zinc-900/80"
          key={metaItem}>
          {metaItem}
        </span>
      ))}
    </div>
  )
}

function ContentItemCard({ item }: { item: AiResumeImportModuleContentItem }) {
  return (
    <article className="grid gap-2 border-t border-zinc-200/70 py-4 first:border-t-0 first:pt-0 last:pb-0 dark:border-zinc-800/80">
      <div className="grid gap-1">
        <strong className="text-sm text-zinc-950 dark:text-white">{item.title}</strong>
        {item.subtitle ? (
          <span className="text-sm text-zinc-600 dark:text-zinc-300">
            {item.subtitle}
          </span>
        ) : null}
      </div>
      <MetaList items={item.meta} />
      {item.body.length > 0 ? (
        <ul className="grid gap-1 text-sm leading-6 text-zinc-700 dark:text-zinc-200">
          {item.body.map((line, index) => (
            <li className="whitespace-pre-wrap" key={`${item.key}-${index}-${line}`}>
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <span className="text-sm text-zinc-400">暂无可展示内容</span>
      )}
    </article>
  )
}

function ContentColumn({
  emptyText,
  items,
  tone,
  title,
}: {
  emptyText: string
  items: AiResumeImportModuleContentItem[]
  tone: 'current' | 'candidate'
  title: string
}) {
  return (
    <section
      className={
        tone === 'candidate'
          ? 'grid gap-3 rounded-[1.25rem] border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-400/25 dark:bg-emerald-500/10'
          : 'grid gap-3 rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50/45 p-4 dark:border-zinc-800 dark:bg-zinc-950/45'
      }>
      <header>
        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
          {title}
        </span>
      </header>
      <div className="grid">
        {items.length > 0 ? (
          items.map((item) => <ContentItemCard item={item} key={item.key} />)
        ) : (
          <div className="rounded-[0.85rem] border border-dashed border-zinc-200 p-4 text-sm text-zinc-400 dark:border-zinc-800">
            {emptyText}
          </div>
        )}
      </div>
    </section>
  )
}

export function ResumeImportResultShell({
  locale,
  resultId,
}: ResumeImportResultShellProps) {
  const router = useRouter()
  const { accessToken, currentUser, status } = useAdminSession()
  const [selectedModules, setSelectedModules] = useState<AiResumeImportModule[]>([])
  const [appliedModules, setAppliedModules] = useState<AiResumeImportModule[]>([])
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [hasAppliedResult, setHasAppliedResult] = useState(false)
  const requestKeyRef = useRef<string | null>(null)
  const {
    data,
    error,
    loading,
    send: fetchResult,
  } = useRequest(
    () =>
      createFetchAiResumeImportResultMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        resultId,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const { loading: applyPending, send: applyImportResult } = useRequest(
    (modules: AiResumeImportModule[]) =>
      createApplyAiResumeImportMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        resultId,
        modules,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const result = (data ?? null) as AiResumeImportResult | null
  const canApply =
    Boolean(currentUser?.capabilities.canEditResume) &&
    (result?.canApply ?? true) &&
    !hasAppliedResult
  const applyableModules = useMemo(
    () => selectedModules.filter((module) => !appliedModules.includes(module)),
    [appliedModules, selectedModules],
  )
  const moduleContents = useMemo(
    () => (result ? fallbackModuleContents(result) : []),
    [result],
  )

  useEffect(() => {
    if (status !== 'ready' || !accessToken) {
      return
    }

    const requestKey = `${status}:${accessToken}:${resultId}`

    if (requestKeyRef.current === requestKey) {
      return
    }

    requestKeyRef.current = requestKey
    void fetchResult().catch(() => undefined)
  }, [accessToken, fetchResult, resultId, status])

  useEffect(() => {
    if (!result) {
      return
    }

    setSelectedModules(result.changedModules)
    setAppliedModules(result.appliedModules)
    setHasAppliedResult(!result.canApply)
    setFeedbackMessage(null)
  }, [result])

  if (status !== 'ready' || !currentUser) {
    return null
  }

  function toggleSelectedModule(module: AiResumeImportModule) {
    if (appliedModules.includes(module)) {
      return
    }

    setSelectedModules((currentModules) =>
      currentModules.includes(module)
        ? currentModules.filter((item) => item !== module)
        : [...currentModules, module],
    )
  }

  async function handleApplyModules(modules: AiResumeImportModule[]) {
    if (!canApply) {
      setFeedbackMessage('当前角色不能写回草稿。')
      return
    }

    const normalizedModules = modules.filter((module) => !appliedModules.includes(module))

    if (normalizedModules.length === 0) {
      setFeedbackMessage('当前没有可继续写回草稿的模块。')
      return
    }

    try {
      await applyImportResult(normalizedModules)
      setAppliedModules(normalizedModules)
      setSelectedModules([])
      setHasAppliedResult(true)
      setFeedbackMessage(
        `已将 ${normalizedModules.map(moduleLabel).join('、')} 写回草稿，公开站仍需手动发布。该识别结果已写回草稿；如需继续导入，请重新上传识别。`,
      )
    } catch (applyError) {
      setFeedbackMessage(
        applyError instanceof Error ? applyError.message : '回填失败，请稍后重试',
      )
    }
  }

  return (
    <div className="stack">
      <section className="grid gap-5 rounded-[2rem] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,250,247,0.92))] p-6 shadow-sm dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(20,20,24,0.96),rgba(14,24,18,0.92))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <p className="eyebrow">简历导入识别</p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              候选草稿 Diff 看台
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              这里展示上传简历识别出的候选草稿。你可以按模块确认后写回
              draft；公开站不会自动变化。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">结果 ID：{resultId.slice(0, 8)}</Chip>
            {result ? (
              <>
                <Chip size="sm">{result.fileName}</Chip>
                <Chip size="sm">
                  生成于：{formatGeneratedAt(result.createdAt, locale)}
                </Chip>
              </>
            ) : null}
          </div>
        </div>

        {feedbackMessage ? (
          <div className="dashboard-inline-note">{feedbackMessage}</div>
        ) : null}
        {result && (!result.canApply || hasAppliedResult) ? (
          <div className="dashboard-inline-note">
            该识别结果已写回草稿；如需继续导入，请重新上传识别。
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-3" data-testid="resume-import-result-loading">
            <Skeleton className="h-5 w-1/3 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
            <Skeleton className="h-24 rounded-[1.5rem] bg-zinc-200/70 dark:bg-zinc-800/70" />
            <Skeleton className="h-48 rounded-[1.5rem] bg-zinc-200/70 dark:bg-zinc-800/70" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="grid gap-4 rounded-[1.5rem] border border-red-200/70 bg-red-50/80 p-5 dark:border-red-400/20 dark:bg-red-500/10">
            <strong className="text-sm text-red-700 dark:text-red-200">
              {error.message}
            </strong>
            <div className="dashboard-entry-actions">
              <Button
                onPress={() => router.push('/dashboard/ai')}
                size="md"
                variant="outline">
                返回 AI 工作台
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && result ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <article className="grid gap-3 rounded-[1.5rem] border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="eyebrow">识别摘要</p>
                <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                  {result.summary}
                </h2>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  字符数：{result.charCount}，Provider：{result.providerSummary.provider}{' '}
                  / {result.providerSummary.model}
                </p>
              </article>

              <article className="grid gap-3 rounded-[1.5rem] border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="eyebrow">模块统计</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="status-box">经历：{result.moduleStats.experiences}</div>
                  <div className="status-box">项目：{result.moduleStats.projects}</div>
                  <div className="status-box">技能：{result.moduleStats.skills}</div>
                  <div className="status-box">亮点：{result.moduleStats.highlights}</div>
                </div>
              </article>
            </div>

            {result.warnings.length > 0 ? (
              <section className="grid gap-2 rounded-[1.5rem] border border-amber-200/70 bg-amber-50/80 p-5 dark:border-amber-300/25 dark:bg-amber-500/10">
                <p className="eyebrow">质量提醒</p>
                {result.warnings.map((warning) => (
                  <p
                    className="text-sm leading-6 text-amber-800 dark:text-amber-100"
                    key={warning}>
                    {warning}
                  </p>
                ))}
              </section>
            ) : null}

            {result.sourceSnapshot || result.formatReport ? (
              <section className="grid gap-4 rounded-[1.5rem] border border-sky-200/80 bg-sky-50/70 p-5 dark:border-sky-300/20 dark:bg-sky-500/10">
                <div className="grid gap-1">
                  <p className="eyebrow">输入治理报告</p>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {result.formatReport?.summary ?? '已完成上传原文备份与输入治理。'}
                  </h2>
                  <p className="text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    系统会先备份上传原文，再丢弃明显无关或风险内容，最后使用格式归一后的中间稿生成候选草稿。
                  </p>
                </div>

                <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-200 md:grid-cols-4">
                  <div className="status-box">
                    原文：
                    {result.sourceSnapshot?.rawCharCount ??
                      result.formatReport?.rawCharCount ??
                      result.charCount}{' '}
                    字符
                  </div>
                  <div className="status-box">
                    格式化后：
                    {result.sourceSnapshot?.formattedCharCount ??
                      result.formatReport?.formattedCharCount ??
                      result.charCount}{' '}
                    字符
                  </div>
                  <div className="status-box">
                    丢弃：{result.formatReport?.discardedLineCount ?? 0} 条
                  </div>
                  <div className="status-box">
                    文件：
                    {result.sourceSnapshot
                      ? formatFileSize(result.sourceSnapshot.fileSize)
                      : result.fileType.toUpperCase()}
                  </div>
                </div>

                {result.sourceSnapshot ? (
                  <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                    sourceHash：{result.sourceSnapshot.sourceHash.slice(0, 16)}...
                  </p>
                ) : null}

                {result.formatReport?.safetyFlags.length ? (
                  <div className="flex flex-wrap gap-2">
                    {result.formatReport.safetyFlags.map((flag) => (
                      <Chip key={flag} size="sm">
                        {safetyFlagLabel(flag)}
                      </Chip>
                    ))}
                  </div>
                ) : null}

                {result.formatReport?.warnings.length ? (
                  <div className="grid gap-1">
                    {result.formatReport.warnings.map((warning) => (
                      <p
                        className="text-sm leading-6 text-sky-900 dark:text-sky-100"
                        key={warning}>
                        {warning}
                      </p>
                    ))}
                  </div>
                ) : null}

                {result.formatReport?.discardedItems.length ? (
                  <div className="grid gap-2 rounded-[1.25rem] border border-sky-200/70 bg-white/70 p-4 dark:border-sky-300/20 dark:bg-zinc-950/40">
                    <strong className="text-sm text-zinc-950 dark:text-white">
                      已丢弃内容摘要
                    </strong>
                    {result.formatReport.discardedItems.map((item, index) => (
                      <div
                        className="grid gap-1 border-t border-sky-100 pt-2 first:border-t-0 first:pt-0 dark:border-sky-300/10"
                        key={`${item.riskType}-${index}-${item.summary}`}>
                        <span className="text-sm text-zinc-700 dark:text-zinc-200">
                          {item.reason}
                        </span>
                        <span className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                          {safetyFlagLabel(item.riskType)}：{item.summary}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </section>
            ) : null}

            <div className="grid gap-4">
              {moduleContents.map((moduleContent) => {
                const moduleDiff = result.moduleDiffs.find(
                  (diff) => diff.module === moduleContent.module,
                )
                const isApplied = appliedModules.includes(moduleContent.module)
                const isSelected = selectedModules.includes(moduleContent.module)
                const status = moduleDiff?.status ?? 'unchanged'

                return (
                  <article
                    className="grid gap-4 rounded-[1.75rem] border border-zinc-200/80 bg-white/85 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
                    key={moduleContent.module}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="eyebrow">
                            模块：{moduleLabel(moduleContent.module)}
                          </p>
                          <Chip size="sm">{statusLabel(status)}</Chip>
                          {isApplied ? (
                            <Chip color="success" size="sm">
                              已写回
                            </Chip>
                          ) : null}
                          {!isApplied && isSelected ? (
                            <Chip size="sm">待写回</Chip>
                          ) : null}
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
                          {moduleContent.title}
                        </h3>
                        <p className="max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {moduleDiff?.reason ?? 'AI 识别结果与当前草稿暂无明显差异。'}
                        </p>
                      </div>
                      <div className="dashboard-entry-actions">
                        <Button
                          isDisabled={isApplied || !canApply || status === 'unchanged'}
                          onPress={() => toggleSelectedModule(moduleContent.module)}
                          size="sm"
                          type="button"
                          variant={isSelected ? 'secondary' : 'outline'}>
                          {isSelected ? '已加入批量' : '加入批量'}
                        </Button>
                        <Button
                          className={adminPrimaryButtonClass}
                          isDisabled
                          size="sm"
                          type="button"
                          variant="primary">
                          仅支持一次性回填
                        </Button>
                      </div>
                    </div>

                    {moduleContent.warnings.length > 0 ? (
                      <div className="grid gap-2 rounded-[1.25rem] border border-amber-200/70 bg-amber-50/70 p-4 dark:border-amber-300/20 dark:bg-amber-500/10">
                        <strong className="text-sm text-amber-800 dark:text-amber-100">
                          {moduleContent.title}质量提醒
                        </strong>
                        {moduleContent.warnings.map((warning) => (
                          <p
                            className="text-sm leading-6 text-amber-800 dark:text-amber-100"
                            key={warning}>
                            {warning}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    <div
                      className="grid gap-3 md:grid-cols-2"
                      data-testid="resume-import-diff-grid">
                      <ContentColumn
                        emptyText="当前草稿暂无该模块内容"
                        items={moduleContent.currentItems}
                        title="当前草稿"
                        tone="current"
                      />
                      <ContentColumn
                        emptyText="候选草稿暂无该模块内容"
                        items={moduleContent.candidateItems}
                        title="候选草稿"
                        tone="candidate"
                      />
                    </div>
                  </article>
                )
              })}
            </div>

            <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="grid gap-1">
                <p className="eyebrow">批量动作</p>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  只会写回选中的模块到当前 draft，不会自动发布公开站。
                </p>
              </div>
              <div className="dashboard-entry-actions">
                <Button
                  onPress={() => router.push('/dashboard/resume')}
                  size="md"
                  type="button"
                  variant="outline">
                  去简历编辑页
                </Button>
                <Button
                  onPress={() => router.push('/dashboard/ai')}
                  size="md"
                  type="button"
                  variant="outline">
                  返回工作台
                </Button>
                <Button
                  className={adminPrimaryButtonClass}
                  isDisabled={applyPending || applyableModules.length === 0 || !canApply}
                  onPress={() => void handleApplyModules(applyableModules)}
                  size="md"
                  type="button"
                  variant="primary">
                  {applyPending ? '正在写回草稿...' : '写回所有已选模块'}
                </Button>
              </div>
            </section>
          </>
        ) : null}
      </section>
    </div>
  )
}

'use client'

import { useRequest } from 'alova/client'
import { Button, Card, CardContent, CardHeader, Chip, Skeleton } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { adminPrimaryButtonClass } from '@core/button-styles'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { readResumeLocaleCookie } from '../../resume/_resume/utils/resume-locale'
import {
  createApplyAiResumeOptimizationMethod,
  createFetchAiResumeOptimizationResultMethod,
} from './services/ai-workbench-api'
import type {
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationResult,
} from './types/ai-workbench.types'

interface ResumeOptimizationResultShellProps {
  locale: AppLocale
  resultId: string
}

function formatGeneratedAt(createdAt: string, locale: 'en' | 'zh') {
  const normalizedLocale = locale === 'en' ? 'en-US' : 'zh-CN'

  return new Date(createdAt).toLocaleString(normalizedLocale, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    day: 'numeric',
  })
}

function moduleLabel(module: AiResumeOptimizationChangedModule, locale: 'en' | 'zh') {
  const moduleMap = {
    experiences: locale === 'en' ? 'Experiences' : '工作经历',
    highlights: locale === 'en' ? 'Highlights' : '亮点总结',
    profile: locale === 'en' ? 'Profile' : '个人定位',
    projects: locale === 'en' ? 'Projects' : '项目经历',
  } as const

  return moduleMap[module]
}

const diffCardTitleClassName = 'text-sm font-bold text-zinc-800 dark:text-zinc-100'
const diffCardTextClassName = 'text-sm leading-6 text-zinc-700 dark:text-zinc-200'
const diffCardContentClassName = `grid h-full gap-2 ${diffCardTextClassName}`
const diffCurrentCardClassName =
  'min-h-[7rem] border border-zinc-200/80 bg-white/92 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/72'
const diffSuggestedCardClassName =
  'min-h-[7rem] border !border-rose-200/80 !bg-rose-50/80 shadow-[0_14px_32px_rgba(244,63,94,0.08)] dark:!border-rose-400/25 dark:!bg-rose-500/12'
const diffSuggestionCardClassName =
  'min-h-[7rem] border !border-sky-200/70 !bg-sky-50/75 shadow-sm dark:!border-sky-400/20 dark:!bg-sky-500/10'
const diffReasonCardClassName =
  'min-h-[7rem] border !border-amber-200/70 !bg-amber-50/80 shadow-sm dark:!border-amber-300/25 dark:!bg-amber-500/10'

export function ResumeOptimizationResultShell({
  locale,
  resultId,
}: ResumeOptimizationResultShellProps) {
  const router = useRouter()
  const { accessToken, currentUser, status } = useAdminSession()
  const resultLocale = (readResumeLocaleCookie() ?? locale) === 'en' ? 'en' : 'zh'
  const [selectedModules, setSelectedModules] = useState<
    AiResumeOptimizationChangedModule[]
  >([])
  const [appliedModules, setAppliedModules] = useState<
    AiResumeOptimizationChangedModule[]
  >([])
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [requestKey, setRequestKey] = useState<string | null>(null)
  const { data, error, loading, send: fetchResult } = useRequest(
    () =>
      createFetchAiResumeOptimizationResultMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        locale: resultLocale,
        resultId,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const {
    loading: applyPending,
    send: applySuggestion,
  } = useRequest(
    (modules: AiResumeOptimizationChangedModule[]) =>
      createApplyAiResumeOptimizationMethod({
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
  const requestKeyRef = useRef<string | null>(null)
  const result = (data ?? null) as AiResumeOptimizationResult | null
  const canApply =
    Boolean(currentUser?.capabilities.canEditResume) && (result?.canApply ?? true)
  const applyDisabledReason =
    result?.canApply === false ? '该历史记录不支持再次应用，请重新生成。' : null

  useEffect(() => {
    if (status !== 'ready' || !accessToken) {
      return
    }

    const nextRequestKey = `${status}:${accessToken}:${resultId}:${resultLocale}`
    setRequestKey(nextRequestKey)

    if (requestKeyRef.current === nextRequestKey) {
      return
    }

    requestKeyRef.current = nextRequestKey
    void fetchResult().catch(() => undefined)
  }, [accessToken, fetchResult, resultId, resultLocale, status])

  useEffect(() => {
    if (!result) {
      return
    }

    setSelectedModules(result.changedModules)
    setAppliedModules([])
    setFeedbackMessage(null)
  }, [result])

  const applyableModules = useMemo(
    () => selectedModules.filter((module) => !appliedModules.includes(module)),
    [appliedModules, selectedModules],
  )

  if (status !== 'ready' || !currentUser) {
    return null
  }

  async function handleApplyModules(modules: AiResumeOptimizationChangedModule[]) {
    if (!canApply) {
      setFeedbackMessage(applyDisabledReason ?? '当前记录暂不支持再次应用。')
      return
    }

    const normalizedModules = modules.filter((module) => !appliedModules.includes(module))

    if (normalizedModules.length === 0) {
      setFeedbackMessage('当前没有可继续写回草稿的模块。')
      return
    }

    try {
      await applySuggestion(normalizedModules)
      setAppliedModules((currentModules) => [...currentModules, ...normalizedModules])
      setSelectedModules((currentModules) =>
        currentModules.filter((module) => !normalizedModules.includes(module)),
      )
      setFeedbackMessage(
        `已将 ${normalizedModules.length} 个模块写回后台草稿。公开站仍需手动发布。`,
      )
    } catch (applyError) {
      const message =
        applyError instanceof Error ? applyError.message : '应用失败，请稍后重试'
      setFeedbackMessage(message)
    }
  }

  function toggleSelectedModule(module: AiResumeOptimizationChangedModule) {
    if (appliedModules.includes(module)) {
      return
    }

    setSelectedModules((currentModules) =>
      currentModules.includes(module)
        ? currentModules.filter((item) => item !== module)
        : [...currentModules, module],
    )
  }

  function resetModuleSelection(module: AiResumeOptimizationChangedModule) {
    if (appliedModules.includes(module)) {
      setFeedbackMessage('该模块已经写回草稿；当前版本的“重置”只负责取消待应用状态。')
      return
    }

    setSelectedModules((currentModules) => currentModules.filter((item) => item !== module))
    setFeedbackMessage(`已将${moduleLabel(module, resultLocale)}从待应用列表中移除。`)
  }

  function batchButtonLabel(module: AiResumeOptimizationChangedModule) {
    if (appliedModules.includes(module)) {
      return '已应用'
    }

    if (selectedModules.includes(module)) {
      return '已加入批量'
    }

    return '加入批量应用'
  }

  return (
    <div className="stack">
      <section className="grid gap-5 rounded-[2rem] border border-zinc-200/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,247,255,0.92))] p-6 shadow-sm dark:border-zinc-800 dark:bg-[linear-gradient(180deg,rgba(20,20,24,0.96),rgba(14,18,28,0.92))]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="grid gap-2">
            <p className="eyebrow">结果页</p>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              当前草稿优化建议
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              左侧代表当前草稿，右侧代表 AI 建议稿。你可以按模块阅读原因、对比字段变化，再选择批量或单模块应用。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">结果 ID：{resultId.slice(0, 8)}</Chip>
            <Chip size="sm">展示语言：{resultLocale === 'en' ? 'English' : '中文'}</Chip>
            {result ? (
              <Chip size="sm">
                生成于：{formatGeneratedAt(result.createdAt, resultLocale)}
              </Chip>
            ) : null}
          </div>
        </div>

        {feedbackMessage ? <div className="dashboard-inline-note">{feedbackMessage}</div> : null}
        {applyDisabledReason ? (
          <div className="dashboard-inline-note">{applyDisabledReason}</div>
        ) : null}

        {loading ? (
          <div className="grid gap-3" data-testid="resume-optimization-result-loading">
            <Skeleton className="h-5 w-1/3 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
            <Skeleton className="h-20 rounded-[1.5rem] bg-zinc-200/70 dark:bg-zinc-800/70" />
            <Skeleton className="h-48 rounded-[1.5rem] bg-zinc-200/70 dark:bg-zinc-800/70" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="grid gap-4 rounded-[1.5rem] border border-red-200/70 bg-red-50/80 p-5 dark:border-red-400/20 dark:bg-red-500/10">
            <strong className="text-sm text-red-700 dark:text-red-200">
              {error.message}
            </strong>
            <div className="dashboard-entry-actions">
              <Button onPress={() => router.push('/dashboard/ai')} size="md" variant="outline">
                返回 AI 工作台
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && result ? (
          <>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <article className="grid gap-4 rounded-[1.5rem] border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <div className="grid gap-2">
                  <p className="eyebrow">分析概览</p>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-white">
                    {result.summary}
                  </h2>
                </div>
                {result.focusAreas.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {result.focusAreas.map((item) => (
                      <span
                        className="rounded-full border border-zinc-200/70 bg-zinc-50 px-3 py-1 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
                        key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>

              <article className="grid gap-3 rounded-[1.5rem] border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
                <p className="eyebrow">运行摘要</p>
                <div className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <div className="status-box">
                    Provider：{result.providerSummary.provider} / {result.providerSummary.model}
                  </div>
                  <div className="status-box">
                    影响模块：{result.changedModules.map((item) => moduleLabel(item, resultLocale)).join('、')}
                  </div>
                  <div className="status-box">
                    当前已选：{applyableModules.length} / {result.changedModules.length}
                  </div>
                </div>
              </article>
            </div>

            <section className="grid gap-3 rounded-[1.5rem] border border-zinc-200/80 bg-white/75 p-5 dark:border-zinc-800 dark:bg-zinc-950/65">
              <p className="eyebrow">对比说明</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50/90 p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
                  <strong className="text-sm text-zinc-950 dark:text-white">基线内容</strong>
                  <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    中性卡片展示数据库里的当前内容，用于确认改写前的事实基础。
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-blue-200/70 bg-blue-50/80 p-4 dark:border-blue-400/20 dark:bg-blue-500/10">
                  <strong className="text-sm text-zinc-950 dark:text-white">建议内容</strong>
                  <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                    蓝色卡片展示候选表达，并补充建议说明与原因说明，便于决定是否按模块应用。
                  </p>
                </div>
              </div>
            </section>

            <div className="grid gap-4">
              {result.moduleDiffs.map((moduleDiff) => {
                const isApplied = appliedModules.includes(moduleDiff.module)
                const isSelected = selectedModules.includes(moduleDiff.module)

                return (
                  <article
                    className="grid gap-4 rounded-[1.75rem] border border-zinc-200/80 bg-white/85 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
                    id={`module-${moduleDiff.module}`}
                    key={moduleDiff.module}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="eyebrow">模块：{moduleLabel(moduleDiff.module, resultLocale)}</p>
                          {isApplied ? <Chip color="success" size="sm">已应用</Chip> : null}
                          {!isApplied && isSelected ? <Chip size="sm">待应用</Chip> : null}
                        </div>
                        <h3 className="text-lg font-semibold text-zinc-950 dark:text-white">
                          {moduleDiff.title}
                        </h3>
                        <p className="max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {moduleDiff.reason}
                        </p>
                      </div>
                      <div className="grid gap-3 justify-items-start">
                        <div className="dashboard-entry-actions">
                          <Button
                            isDisabled={isApplied}
                            onPress={() => toggleSelectedModule(moduleDiff.module)}
                            size="sm"
                            type="button"
                            variant={isSelected ? 'secondary' : 'outline'}>
                            {batchButtonLabel(moduleDiff.module)}
                          </Button>
                          <Button
                            className={adminPrimaryButtonClass}
                            isDisabled={applyPending || isApplied || !canApply}
                            onPress={() => void handleApplyModules([moduleDiff.module])}
                            size="sm"
                            type="button"
                            variant="primary">
                            只应用当前建议
                          </Button>
                          <Button
                            isDisabled={applyPending || isApplied || !isSelected}
                            onPress={() => resetModuleSelection(moduleDiff.module)}
                            size="sm"
                            type="button"
                            variant="outline">
                            重置回当前草稿
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4">
                      {moduleDiff.entries.map((entry) => (
                        <div
                          className="grid gap-3 rounded-[1.5rem] bg-zinc-50/70 dark:bg-zinc-900/42"
                          key={entry.key}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <strong className="text-sm text-zinc-950 dark:text-white">
                              {entry.label}
                            </strong>
                            <span className="rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-200">
                              字段级建议
                            </span>
                          </div>

                          <div
                            className="grid grid-cols-2 gap-4 md:grid-cols-4"
                            data-testid="resume-diff-grid">
                            <Card
                              className={diffCurrentCardClassName}
                              data-testid="resume-diff-current-section">
                              <CardHeader>
                                <span className={diffCardTitleClassName}>当前内容</span>
                              </CardHeader>
                              <CardContent className={diffCardContentClassName}>
                                <span className="whitespace-pre-wrap">{entry.currentValue}</span>
                              </CardContent>
                            </Card>
                            <Card
                              className={diffSuggestedCardClassName}
                              data-testid="resume-diff-suggested-section">
                              <CardHeader>
                                <span className={diffCardTitleClassName}>修改内容</span>
                              </CardHeader>
                              <CardContent className={diffCardContentClassName}>
                                <span className="whitespace-pre-wrap">{entry.suggestedValue}</span>
                              </CardContent>
                            </Card>
                            <Card
                              className={diffSuggestionCardClassName}
                              data-testid="resume-diff-suggestion-section">
                              <CardHeader>
                                <strong className={diffCardTitleClassName}>建议说明</strong>
                              </CardHeader>
                              <CardContent className={diffCardContentClassName}>
                                <p>{entry.suggestion}</p>
                              </CardContent>
                            </Card>
                            <Card
                              className={diffReasonCardClassName}
                              data-testid="resume-diff-reason-section">
                              <CardHeader>
                                <strong className={diffCardTitleClassName}>原因说明</strong>
                              </CardHeader>
                              <CardContent className={diffCardContentClassName}>
                                <p>{entry.reason}</p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                )
              })}
            </div>

            <section className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-5 dark:border-zinc-800 dark:bg-zinc-950/70">
              <div className="grid gap-1">
                <p className="eyebrow">批量动作</p>
                <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                  只会把仍处于“待应用”状态的模块写回当前草稿，不会自动发布公开站。
                </p>
              </div>
              <div className="dashboard-entry-actions">
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
                  {applyPending ? '正在写回当前草稿...' : '应用所有已选模块'}
                </Button>
              </div>
            </section>
          </>
        ) : null}
      </section>

      {requestKey ? <span className="hidden" data-request-key={requestKey} /> : null}
    </div>
  )
}

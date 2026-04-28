'use client'

import { useRequest } from 'alova/client'
import { Button, Card, CardContent, CardHeader, Chip, Skeleton } from '@heroui/react'
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

function formatGeneratedAt(createdAt: string, locale: AppLocale) {
  return new Date(createdAt).toLocaleString(locale === 'en' ? 'en-US' : 'zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    day: 'numeric',
  })
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

            <div className="grid gap-4">
              {result.moduleDiffs.map((moduleDiff) => {
                const isApplied = appliedModules.includes(moduleDiff.module)
                const isSelected = selectedModules.includes(moduleDiff.module)

                return (
                  <article
                    className="grid gap-4 rounded-[1.75rem] border border-zinc-200/80 bg-white/85 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/70"
                    key={moduleDiff.module}>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="grid gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="eyebrow">
                            模块：{moduleLabel(moduleDiff.module)}
                          </p>
                          <Chip size="sm">{statusLabel(moduleDiff.status)}</Chip>
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
                          {moduleDiff.title}
                        </h3>
                        <p className="max-w-3xl text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                          {moduleDiff.reason}
                        </p>
                      </div>
                      <div className="dashboard-entry-actions">
                        <Button
                          isDisabled={
                            isApplied || !canApply || moduleDiff.status === 'unchanged'
                          }
                          onPress={() => toggleSelectedModule(moduleDiff.module)}
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

                    {moduleDiff.entries.map((entry) => (
                      <div
                        className="grid gap-3 rounded-[1.5rem] bg-zinc-50/70 p-4 dark:bg-zinc-900/42"
                        key={entry.key}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <strong className="text-sm text-zinc-950 dark:text-white">
                            {entry.label}
                          </strong>
                          {entry.warning ? (
                            <span className="rounded-full border border-amber-200/70 bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">
                              {entry.warning}
                            </span>
                          ) : null}
                        </div>
                        <div
                          className="grid gap-3 md:grid-cols-2"
                          data-testid="resume-import-diff-grid">
                          <Card className="border border-zinc-200/80 bg-white/92 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/72">
                            <CardHeader>
                              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                                当前草稿
                              </span>
                            </CardHeader>
                            <CardContent className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                              <span className="whitespace-pre-wrap">
                                {entry.currentValue}
                              </span>
                            </CardContent>
                          </Card>
                          <Card className="border !border-emerald-200/80 !bg-emerald-50/80 shadow-[0_14px_32px_rgba(16,185,129,0.08)] dark:!border-emerald-400/25 dark:!bg-emerald-500/12">
                            <CardHeader>
                              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100">
                                候选草稿
                              </span>
                            </CardHeader>
                            <CardContent className="text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                              <span className="whitespace-pre-wrap">
                                {entry.suggestedValue}
                              </span>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    ))}
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

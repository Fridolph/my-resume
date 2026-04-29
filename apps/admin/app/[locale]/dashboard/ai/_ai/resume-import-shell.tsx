'use client'

import { Button } from '@heroui/react/button'
import { Chip } from '@heroui/react/chip'
import { useRequest } from 'alova/client'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { useAdminSession } from '@core/admin-session'
import { DEFAULT_API_BASE_URL } from '@core/env'
import type { AppLocale } from '@i18n/types'

import { ResumeImportPanel } from './components/resume-import-panel'
import { ResumeImportHistoryTable } from './components/resume-import-history-table'
import {
  createDeleteAiUsageRecordMethod,
  createFetchAiUsageHistoryMethod,
  createFetchAiUsageRecordDetailMethod,
} from './services/ai-workbench-api'
import type {
  AiUsageRecordDetail,
  AiUsageRecordSummary,
} from './types/ai-workbench.types'

export function ResumeImportShell({ locale: _locale }: { locale: AppLocale }) {
  const router = useRouter()
  const { accessToken, currentUser, status } = useAdminSession()
  const historyRequestKeyRef = useRef<string | null>(null)
  const [selectedHistoryDetail, setSelectedHistoryDetail] =
    useState<AiUsageRecordDetail | null>(null)
  const [historyActionError, setHistoryActionError] = useState<string | null>(null)
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null)
  const { data: historyRecords = [], send: fetchHistory } = useRequest(
    () =>
      createFetchAiUsageHistoryMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        type: 'resume-import',
        limit: 50,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const { send: fetchHistoryDetail } = useRequest(
    (recordId: string) =>
      createFetchAiUsageRecordDetailMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        recordId,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const { send: deleteHistoryRecord } = useRequest(
    (recordId: string) =>
      createDeleteAiUsageRecordMethod({
        apiBaseUrl: DEFAULT_API_BASE_URL,
        accessToken: accessToken ?? '',
        recordId,
      }),
    {
      force: true,
      immediate: false,
    },
  )

  useEffect(() => {
    if (status !== 'ready' || !accessToken) {
      return
    }

    const requestKey = `${DEFAULT_API_BASE_URL}:${accessToken}:resume-import-history`

    if (historyRequestKeyRef.current === requestKey) {
      return
    }

    historyRequestKeyRef.current = requestKey
    void fetchHistory().catch(() => undefined)
  }, [accessToken, fetchHistory, status])

  async function handleViewHistoryRecord(record: AiUsageRecordSummary) {
    setHistoryActionError(null)

    try {
      setSelectedHistoryDetail(await fetchHistoryDetail(record.id))
    } catch (error) {
      setHistoryActionError(
        error instanceof Error ? error.message : '历史记录详情加载失败，请稍后重试',
      )
    }
  }

  async function handleDeleteHistoryRecord(record: AiUsageRecordSummary) {
    if (!window.confirm(`确认删除这条识别记录吗？\n${record.inputPreview}`)) {
      return
    }

    setHistoryActionError(null)
    setDeletingRecordId(record.id)

    try {
      await deleteHistoryRecord(record.id)
      if (selectedHistoryDetail?.id === record.id) {
        setSelectedHistoryDetail(null)
      }
      await fetchHistory()
    } catch (error) {
      setHistoryActionError(
        error instanceof Error ? error.message : '历史记录删除失败，请稍后重试',
      )
    } finally {
      setDeletingRecordId(null)
    }
  }

  if (status !== 'ready' || !currentUser || !accessToken) {
    return null
  }

  const canUpload = Boolean(currentUser.capabilities.canTriggerAiAnalysis)
  const moduleShellClass =
    'mt-4 rounded-lg border-b border-zinc-200/80 bg-white px-4 py-5 dark:border-zinc-800 dark:bg-zinc-950 sm:px-5 sm:py-6 lg:px-6'
  const moduleHeaderClass = 'grid gap-2'

  return (
    <div className="bg-[#ebebee] dark:bg-zinc-950">
      <section className={moduleShellClass}>
        <div className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Chip size="sm">当前账号：{currentUser.username}</Chip>
            <Chip size="sm">当前角色：{currentUser.role}</Chip>
            <Chip size="sm">异步识别</Chip>
          </div>
          <div className={moduleHeaderClass}>
            <p className="eyebrow">resume import</p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-white">
              简历导入识别
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
              这里专门处理“上传已有中文简历 → AI 识别候选草稿 → 进入 diff 看台 →
              按模块回填草稿”。上传后会显示阶段时间线，失败时保留可读错误与 traceId。
            </p>
          </div>
          <div className="dashboard-entry-actions">
            <Button
              onPress={() => router.push('/dashboard/ai')}
              size="md"
              type="button"
              variant="outline">
              返回 AI 工作台
            </Button>
            <Button
              onPress={() => router.push('/dashboard/resume')}
              size="md"
              type="button"
              variant="outline">
              前往简历编辑
            </Button>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="resume-import-upload-title"
        className={moduleShellClass}>
        <div className={moduleHeaderClass}>
          <h2
            className="text-[1.75rem] font-semibold tracking-tight text-zinc-950 dark:text-white"
            id="resume-import-upload-title">
            上传自己的中文简历
          </h2>
          <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            第一版只支持 Markdown / TXT：系统会先备份上传原文，规则层快速丢弃明显无关或风险内容，再用一次
            AI 调用同时生成候选草稿与输入治理报告。
          </p>
        </div>
        <ResumeImportPanel
          accessToken={accessToken}
          apiBaseUrl={DEFAULT_API_BASE_URL}
          canUpload={canUpload}
        />
      </section>

      <section
        aria-labelledby="resume-import-history-title"
        className={moduleShellClass}
        data-testid="resume-import-history-section">
        <div className={moduleHeaderClass}>
          <p className="eyebrow">history</p>
          <h2
            className="text-[1.75rem] font-semibold tracking-tight text-zinc-950 dark:text-white"
            id="resume-import-history-title">
            历史识别记录
          </h2>
          <p className="max-w-4xl text-sm leading-7 text-zinc-500 dark:text-zinc-400">
            这里展示最近的简历导入识别成功与失败记录。成功记录可以重新进入结果看台；失败记录保留错误摘要用于排查。
          </p>
        </div>
        {historyActionError ? <p className="error-text">{historyActionError}</p> : null}
        <ResumeImportHistoryTable
          deletingRecordId={deletingRecordId}
          onDeleteRecord={(record) => void handleDeleteHistoryRecord(record)}
          onViewRecord={(record) => void handleViewHistoryRecord(record)}
          records={historyRecords}
        />
        {selectedHistoryDetail ? (
          <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/70">
            <div className="grid gap-2">
              <strong className="text-zinc-950 dark:text-white">
                历史详情：{selectedHistoryDetail.inputPreview}
              </strong>
              <span className="text-zinc-500 dark:text-zinc-400">
                {selectedHistoryDetail.status === 'failed'
                  ? selectedHistoryDetail.errorMessage ?? '本次识别失败'
                  : selectedHistoryDetail.summary ?? '本次识别暂无摘要'}
              </span>
              <pre className="max-h-80 overflow-auto rounded-xl bg-white p-3 text-xs leading-5 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                {JSON.stringify(selectedHistoryDetail.detail, null, 2)}
              </pre>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

'use client'

import { Button, Drawer } from '@heroui/react'

import { AdminDrawerShell } from '../../../../../_shared/ui/components/heroui'
import type { AiUsageRecordDetail, AiWorkbenchReport } from '../types/ai-workbench.types'
import { formatLocale, formatScenario } from '../utils/analysis-utils'
import { AnalysisReportDetails } from './analysis-report-details'
import { AnalysisReportOverview } from './analysis-report-overview'

interface AiAnalysisReportDrawerProps {
  isOpen: boolean
  onClose: () => void
  onLinkSuggestionModule: (module: 'profile' | 'experiences' | 'projects' | 'highlights') => void
  record: AiUsageRecordDetail | null
}

function isWorkbenchReport(detail: unknown): detail is AiWorkbenchReport {
  if (!detail || typeof detail !== 'object') {
    return false
  }

  const candidate = detail as Record<string, unknown>
  return typeof candidate.reportId === 'string' && typeof candidate.summary === 'string'
}

export function AiAnalysisReportDrawer({
  isOpen,
  onClose,
  onLinkSuggestionModule,
  record,
}: AiAnalysisReportDrawerProps) {
  const report = isWorkbenchReport(record?.detail) ? record.detail : null

  return (
    <AdminDrawerShell
      dialogClassName="max-w-[min(92vw,58rem)]"
      isOpen={isOpen}
      onClose={onClose}>
      <Drawer.Header className="border-b border-zinc-200/80 dark:border-zinc-800">
        <div className="grid gap-2">
          <Drawer.Heading className="text-lg font-semibold text-zinc-950 dark:text-white">
            AI 辅助分析详情
          </Drawer.Heading>
          {record ? (
            <p className="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {formatScenario(record.scenario)} · {formatLocale(record.locale)} · {record.provider}{' '}
              / {record.model}
            </p>
          ) : null}
        </div>
        <Drawer.CloseTrigger aria-label="关闭分析详情" />
      </Drawer.Header>
      <Drawer.Body className="grid gap-4 px-4 py-3">
        {record ? (
          <>
            <div className="rounded-[1.25rem] border border-zinc-200/80 bg-zinc-50/72 p-3 text-sm leading-6 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
              <strong className="block text-zinc-950 dark:text-white">本次调用摘要</strong>
              <span className="mt-1.5 block">
                {record.status === 'failed'
                  ? record.errorMessage ?? '本次调用失败'
                  : record.summary ?? '本次调用未返回摘要'}
              </span>
            </div>

            {record.status === 'failed' || !report ? (
              <div className="rounded-[1.25rem] border border-amber-200/80 bg-amber-50/82 p-3 text-sm leading-6 text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
                当前记录没有可阅读的结构化详情，请根据错误信息决定是否重试。
              </div>
            ) : (
              <>
                <AnalysisReportOverview
                  report={report}
                  runtimeSummary={{
                    provider: record.provider,
                    model: record.model,
                    mode: record.mode,
                    supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'],
                  }}
                />
                <AnalysisReportDetails
                  onLinkSuggestionModule={onLinkSuggestionModule}
                  report={report}
                />
              </>
            )}
          </>
        ) : null}
      </Drawer.Body>
    </AdminDrawerShell>
  )
}

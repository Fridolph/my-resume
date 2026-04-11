'use client'

import { useRequest } from 'alova/client'
import { Skeleton } from '@heroui/react/skeleton'
import { Tag } from '@heroui/react/tag'
import { TagGroup } from '@heroui/react/tag-group'
import { Tabs } from '@heroui/react/tabs'
import { DisplaySectionIntro, DisplaySurfaceCard } from '@my-resume/ui/display'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  createFetchCachedAiWorkbenchReportMethod,
  createFetchCachedAiWorkbenchReportsMethod,
} from '../services/ai-workbench-api'
import {
  AiWorkbenchCachedReportSummary,
  AiWorkbenchReport,
} from '../types/ai-workbench.types'

const cachedReportTabsShellClass =
  'w-full overflow-x-auto'
const cachedReportTabsListClass =
  'grid min-w-max grid-flow-col auto-cols-fr gap-1 rounded-[22px] bg-zinc-100/80 p-1 dark:bg-zinc-950/84 dark:ring-1 dark:ring-white/6 md:min-w-0'
const cachedReportTabClass =
  'relative z-10 rounded-[18px] px-4 py-2.5 text-center text-sm font-semibold text-zinc-500 transition-[background-color,color,box-shadow,transform,opacity] duration-300 ease-out data-[hovered]:bg-white/45 data-[hovered]:text-zinc-700 aria-selected:bg-[var(--admin-primary-soft)]/70 aria-selected:text-[var(--admin-primary)] aria-selected:shadow-[0_8px_22px_rgba(37,99,235,0.12)] dark:text-zinc-300/92 dark:data-[hovered]:bg-white/6 dark:data-[hovered]:text-zinc-100 dark:aria-selected:bg-[rgba(59,130,246,0.22)] dark:aria-selected:text-slate-50 dark:aria-selected:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_rgba(15,23,42,0.34)]'
const analysisSummaryCardClass = 'grid gap-3.5 p-5 md:p-6'
const analysisSectionGridClass = 'grid gap-4'
const analysisSectionCardClass = 'grid gap-3.5 p-5 md:p-6'
const analysisTextBlockClass =
  'whitespace-pre-wrap leading-7 text-zinc-900 dark:text-zinc-100'
const cachedReportMetaTagClass =
  'rounded-full border border-[var(--admin-primary-soft)]/80 bg-[var(--admin-primary-soft)]/45 px-3 py-1 text-sm font-medium text-[var(--admin-primary)] dark:border-[rgba(96,165,250,0.34)] dark:bg-[rgba(37,99,235,0.16)] dark:text-slate-100 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'

interface AiCachedReportsPanelProps {
  accessToken: string
  apiBaseUrl: string
  createReportDetailMethod?: typeof createFetchCachedAiWorkbenchReportMethod
  createReportListMethod?: typeof createFetchCachedAiWorkbenchReportsMethod
  isViewerExperience: boolean
}

const scenarioLabels = {
  'jd-match': 'JD 匹配分析',
  'resume-review': '简历优化建议',
  'offer-compare': 'Offer 对比建议',
} as const

function formatLocale(locale: AiWorkbenchReport['locale']): string {
  return locale === 'zh' ? '中文' : 'English'
}

function formatGenerator(generator: AiWorkbenchReport['generator']): string {
  return generator === 'mock-cache' ? '缓存 / 预设' : '真实 Provider'
}

export function AiCachedReportsPanel({
  accessToken,
  apiBaseUrl,
  createReportDetailMethod = createFetchCachedAiWorkbenchReportMethod,
  createReportListMethod = createFetchCachedAiWorkbenchReportsMethod,
  isViewerExperience,
}: AiCachedReportsPanelProps) {
  const [activeReportId, setActiveReportId] = useState<string | null>(null)
  const loadReportsRef = useRef<() => Promise<AiWorkbenchCachedReportSummary[]>>(
    async () => [],
  )
  const loadReportDetailRef = useRef<
    (reportId: string) => Promise<AiWorkbenchReport | undefined>
  >(async () => undefined)
  const listRequestKeyRef = useRef<string | null>(null)
  const detailRequestKeyRef = useRef<string | null>(null)
  const {
    data: reports = [],
    error: listError,
    loading: loadingList,
    send: loadReports,
  } = useRequest(
    () =>
      createReportListMethod({
        apiBaseUrl,
        accessToken,
      }),
    {
      force: true,
      immediate: false,
      initialData: [] as AiWorkbenchCachedReportSummary[],
    },
  )
  const {
    data: activeReport,
    error: detailError,
    loading: detailLoading,
    send: loadReportDetail,
  } = useRequest(
    (reportId: string) =>
      createReportDetailMethod({
        apiBaseUrl,
        accessToken,
        reportId,
      }),
    {
      force: true,
      immediate: false,
    },
  )
  const validReports = useMemo(
    () =>
      (Array.isArray(reports) ? reports : []).filter(
        (report): report is AiWorkbenchCachedReportSummary =>
          Boolean(report && typeof report.reportId === 'string' && report.reportId.trim()),
      ),
    [reports],
  )
  const listRequestKey = accessToken ? `${apiBaseUrl}:${accessToken}` : null

  useEffect(() => {
    loadReportsRef.current = loadReports
  }, [loadReports])

  useEffect(() => {
    loadReportDetailRef.current = loadReportDetail
  }, [loadReportDetail])

  useEffect(() => {
    if (!listRequestKey || listRequestKeyRef.current === listRequestKey) {
      return
    }

    listRequestKeyRef.current = listRequestKey
    void loadReportsRef.current().catch(() => undefined)
  }, [listRequestKey])

  useEffect(() => {
    if (validReports.length === 0) {
      setActiveReportId(null)
      detailRequestKeyRef.current = null
      return
    }

    const nextActiveReportId =
      activeReportId && validReports.some((report) => report.reportId === activeReportId)
        ? activeReportId
        : validReports[0]?.reportId ?? null

    if (!nextActiveReportId) {
      setActiveReportId(null)
      detailRequestKeyRef.current = null
      return
    }

    if (nextActiveReportId !== activeReportId) {
      setActiveReportId(nextActiveReportId)
    }

    const detailRequestKey = `${apiBaseUrl}:${accessToken}:${nextActiveReportId}`

    if (detailRequestKeyRef.current === detailRequestKey) {
      return
    }

    detailRequestKeyRef.current = detailRequestKey
    void loadReportDetailRef.current(nextActiveReportId).catch(() => undefined)
  }, [accessToken, activeReportId, apiBaseUrl, validReports])

  async function handleSelectReport(reportId: string) {
    if (reportId === activeReportId) {
      return
    }

    detailRequestKeyRef.current = `${apiBaseUrl}:${accessToken}:${reportId}`
    setActiveReportId(reportId)
    await loadReportDetailRef.current(reportId)
  }

  const errorMessage = detailError?.message ?? listError?.message ?? null
  const resolvedActiveReport = activeReport as AiWorkbenchReport | undefined

  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">缓存体验</p>
        <h2>缓存报告与预设体验</h2>
        <p className="muted">
          当前阶段先把 viewer 的只读体验收住，让“能看缓存、不能触发真实分析”的边界更清晰。
        </p>
      </div>

      {isViewerExperience ? (
        <div className="readonly-box">
          viewer 当前只读取缓存或预设分析结果，不能上传文件，也不能触发新的真实分析请求。
        </div>
      ) : (
        <div className="dashboard-inline-note">
          admin 也可在这里回看缓存或预设结果，用于对照真实分析输出。
        </div>
      )}

      {loadingList ? (
        <div className="grid gap-2" data-testid="cached-reports-loading-skeleton">
          <p className="muted">正在加载缓存报告...</p>
          <Skeleton className="h-4 w-1/2 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-4 w-2/3 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      ) : null}

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {!loadingList && validReports.length === 0 ? (
        <p className="muted">当前还没有可阅读的缓存报告。</p>
      ) : null}

      {validReports.length > 0 ? (
        <Tabs
          aria-label="选择缓存报告"
          className="w-full"
          onSelectionChange={(reportId) => void handleSelectReport(String(reportId))}
          selectedKey={activeReportId ?? validReports[0]?.reportId ?? undefined}>
          <Tabs.ListContainer className={cachedReportTabsShellClass}>
            <Tabs.List className={cachedReportTabsListClass}>
              {validReports.map((report: AiWorkbenchCachedReportSummary) => (
                <Tabs.Tab
                  className={cachedReportTabClass}
                  id={report.reportId}
                  key={report.reportId}>
                  {scenarioLabels[report.scenario]}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.ListContainer>
        </Tabs>
      ) : null}

      {detailLoading && !resolvedActiveReport ? (
        <div className="grid gap-2" data-testid="cached-reports-detail-loading-skeleton">
          <p className="muted">正在切换缓存报告...</p>
          <Skeleton className="h-4 w-3/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
          <Skeleton className="h-4 w-4/5 rounded-md bg-zinc-200/80 dark:bg-zinc-800/80" />
        </div>
      ) : null}

      {resolvedActiveReport ? (
        <div
          className={[
            'preview-stack transition-opacity duration-200 ease-out',
            detailLoading ? 'opacity-70' : 'opacity-100',
          ]
            .filter(Boolean)
            .join(' ')}>
          <TagGroup aria-label="当前缓存报告元信息">
            <TagGroup.List className="flex flex-wrap gap-2.5">
              <Tag className={cachedReportMetaTagClass} id="cached-report-scenario">
                场景：{scenarioLabels[resolvedActiveReport.scenario]}
              </Tag>
              <Tag className={cachedReportMetaTagClass} id="cached-report-locale">
                语言：{formatLocale(resolvedActiveReport.locale)}
              </Tag>
              <Tag className={cachedReportMetaTagClass} id="cached-report-generator">
                来源：{formatGenerator(resolvedActiveReport.generator)}
              </Tag>
            </TagGroup.List>
          </TagGroup>

          <DisplaySurfaceCard className={analysisSummaryCardClass}>
            <DisplaySectionIntro
              compact
              description={resolvedActiveReport.inputPreview}
              eyebrow="缓存摘要"
              title="当前报告概览"
              titleAs="h3"
            />
            <div className={analysisTextBlockClass}>{resolvedActiveReport.summary}</div>
          </DisplaySurfaceCard>

          <div className={analysisSectionGridClass}>
            {resolvedActiveReport.sections.map((section: AiWorkbenchReport['sections'][number]) => (
              <DisplaySurfaceCard
                as="article"
                className={analysisSectionCardClass}
                key={section.key}>
                <DisplaySectionIntro compact title={section.title} titleAs="h3" />
                <ul className="muted-list">
                  {section.bullets.map((bullet: string) => (
                    <li key={`${section.key}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              </DisplaySurfaceCard>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  )
}

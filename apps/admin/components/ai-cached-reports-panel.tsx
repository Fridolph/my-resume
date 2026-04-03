'use client';

import { Button } from '@heroui/react';
import {
  DisplayPill,
  DisplaySectionIntro,
  DisplaySurfaceCard,
} from '@my-resume/ui/display';
import { useEffect, useState } from 'react';

import {
  fetchCachedAiWorkbenchReport,
  fetchCachedAiWorkbenchReports,
} from '../lib/ai-workbench-api';
import {
  AiWorkbenchCachedReportSummary,
  AiWorkbenchReport,
} from '../lib/ai-workbench-types';

interface AiCachedReportsPanelProps {
  accessToken: string;
  apiBaseUrl: string;
  isViewerExperience: boolean;
  fetchReportDetail?: typeof fetchCachedAiWorkbenchReport;
  fetchReportList?: typeof fetchCachedAiWorkbenchReports;
}

const scenarioLabels = {
  'jd-match': 'JD 匹配分析',
  'resume-review': '简历优化建议',
  'offer-compare': 'Offer 对比建议',
} as const;

function formatLocale(locale: AiWorkbenchReport['locale']): string {
  return locale === 'zh' ? '中文' : 'English';
}

function formatGenerator(generator: AiWorkbenchReport['generator']): string {
  return generator === 'mock-cache' ? '缓存 / 预设' : '真实 Provider';
}

export function AiCachedReportsPanel({
  accessToken,
  apiBaseUrl,
  isViewerExperience,
  fetchReportDetail = fetchCachedAiWorkbenchReport,
  fetchReportList = fetchCachedAiWorkbenchReports,
}: AiCachedReportsPanelProps) {
  const [reports, setReports] = useState<AiWorkbenchCachedReportSummary[]>([]);
  const [activeReportId, setActiveReportId] = useState<string | null>(null);
  const [activeReport, setActiveReport] = useState<AiWorkbenchReport | null>(null);
  const [loadingState, setLoadingState] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadReports() {
      try {
        setLoadingState('loading');
        setErrorMessage(null);

        const nextReports = await fetchReportList({
          apiBaseUrl,
          accessToken,
        });

        if (cancelled) {
          return;
        }

        setReports(nextReports);

        if (nextReports.length === 0) {
          setActiveReportId(null);
          setActiveReport(null);
          setLoadingState('ready');
          return;
        }

        const nextActiveReportId = nextReports[0].reportId;
        setActiveReportId(nextActiveReportId);

        const detail = await fetchReportDetail({
          apiBaseUrl,
          accessToken,
          reportId: nextActiveReportId,
        });

        if (cancelled) {
          return;
        }

        setActiveReport(detail);
        setLoadingState('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadingState('error');
        setActiveReport(null);
        setErrorMessage(
          error instanceof Error ? error.message : '缓存报告加载失败，请稍后重试',
        );
      }
    }

    void loadReports();

    return () => {
      cancelled = true;
    };
  }, [accessToken, apiBaseUrl, fetchReportDetail, fetchReportList]);

  async function handleSelectReport(reportId: string) {
    if (reportId === activeReportId) {
      return;
    }

    setActiveReportId(reportId);
    setDetailLoading(true);
    setErrorMessage(null);

    try {
      const detail = await fetchReportDetail({
        apiBaseUrl,
        accessToken,
        reportId,
      });

      setActiveReport(detail);
    } catch (error) {
      setActiveReport(null);
      setErrorMessage(
        error instanceof Error ? error.message : '缓存报告详情加载失败，请稍后重试',
      );
    } finally {
      setDetailLoading(false);
    }
  }

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

      {loadingState === 'loading' ? (
        <p className="muted">正在加载缓存报告...</p>
      ) : null}

      {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

      {loadingState === 'ready' && reports.length === 0 ? (
        <p className="muted">当前还没有可阅读的缓存报告。</p>
      ) : null}

      {reports.length > 0 ? (
        <div className="cached-report-list">
          {reports.map((report) => (
            <Button
              className={activeReportId === report.reportId ? 'secondary-button' : ''}
              key={report.reportId}
              onClick={() => void handleSelectReport(report.reportId)}
              type="button"
            >
              {scenarioLabels[report.scenario]}
            </Button>
          ))}
        </div>
      ) : null}

      {detailLoading ? <p className="muted">正在切换缓存报告...</p> : null}

      {activeReport ? (
        <div className="preview-stack">
          <div className="dashboard-badge-row">
            <DisplayPill>
              场景：{scenarioLabels[activeReport.scenario]}
            </DisplayPill>
            <DisplayPill>语言：{formatLocale(activeReport.locale)}</DisplayPill>
            <DisplayPill>来源：{formatGenerator(activeReport.generator)}</DisplayPill>
          </div>

          <DisplaySurfaceCard className="analysis-summary-card">
            <DisplaySectionIntro
              compact
              description={activeReport.inputPreview}
              eyebrow="缓存摘要"
              title="当前报告概览"
              titleAs="h3"
            />
            <div className="analysis-text-block">{activeReport.summary}</div>
          </DisplaySurfaceCard>

          <div className="analysis-section-grid">
            {activeReport.sections.map((section) => (
              <DisplaySurfaceCard
                as="article"
                className="analysis-section-card"
                key={section.key}
              >
                <DisplaySectionIntro compact title={section.title} titleAs="h3" />
                <ul className="muted-list">
                  {section.bullets.map((bullet) => (
                    <li key={`${section.key}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              </DisplaySurfaceCard>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

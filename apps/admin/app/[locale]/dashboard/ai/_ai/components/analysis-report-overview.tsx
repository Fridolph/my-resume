'use client'

import {
  DisplayPill,
  DisplaySectionIntro,
  DisplaySurfaceCard,
} from '@my-resume/ui/display'

import type {
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
} from '../types/ai-workbench.types'
import {
  formatGenerator,
  formatLocale,
  formatScenario,
  formatScore,
} from '../utils/analysis-utils'

interface AnalysisReportOverviewProps {
  report: AiWorkbenchReport | null
  runtimeSummary: AiWorkbenchRuntimeSummary
}

export function AnalysisReportOverview({
  report,
  runtimeSummary,
}: AnalysisReportOverviewProps) {
  return (
    <DisplaySurfaceCard className="grid gap-4 p-5 md:p-6">
      <DisplaySectionIntro
        compact
        description={
          report
            ? '当前结果会把评分、来源、语言和模型上下文收在同一个概览里，方便边看输入边判断结果是否可信。'
            : '触发一次真实分析后，这里会集中展示当前报告概览、结论摘要、判断依据、风险提示和建议动作。'
        }
        eyebrow="分析结果"
        title="当前报告概览"
        titleAs="h3"
      />

      {report ? (
        <>
          <div className="dashboard-badge-row">
            <DisplayPill>场景：{formatScenario(report.scenario)}</DisplayPill>
            <DisplayPill>语言：{formatLocale(report.locale)}</DisplayPill>
            <DisplayPill>来源：{formatGenerator(report.generator)}</DisplayPill>
            <DisplayPill>
              Provider：{runtimeSummary.provider} / {runtimeSummary.model}
            </DisplayPill>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="status-box">
              <strong>{formatScore(report)}</strong>
              <span>{report.score.label}</span>
            </div>
            <div className="status-box">
              <strong>输入预览</strong>
              <span>{report.inputPreview}</span>
            </div>
          </div>
        </>
      ) : (
        <div className="status-box">
          <strong>等待分析结果</strong>
          <span>先在左侧输入完整文本，或通过文件提取同步内容，再触发一次真实分析。</span>
        </div>
      )}
    </DisplaySurfaceCard>
  )
}

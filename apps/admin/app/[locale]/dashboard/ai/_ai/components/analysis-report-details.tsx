'use client'

import { Button } from '@heroui/react'
import { DisplaySectionCard, DisplaySectionIntro, DisplaySurfaceCard } from '@my-resume/ui/display'

import type {
  AiResumeOptimizationChangedModule,
  AiWorkbenchReport,
} from '../types/ai-workbench.types'

const analysisTextBlockClass =
  'whitespace-pre-wrap leading-7 text-zinc-900 dark:text-zinc-100'
const analysisSectionCardClass = 'grid gap-3.5 p-5 md:p-6'

interface AnalysisReportDetailsProps {
  onLinkSuggestionModule: (module: AiResumeOptimizationChangedModule) => void
  report: AiWorkbenchReport
}

export function AnalysisReportDetails({
  onLinkSuggestionModule,
  report,
}: AnalysisReportDetailsProps) {
  return (
    <>
      <DisplaySectionCard
        className="grid gap-4 p-5 md:p-6"
        compact
        description="先给出面向用户的整体判断，再展开为什么这样判断。这样更适合简历修改和面试准备。"
        eyebrow="结论层"
        title="结论摘要"
        titleAs="h3">
        <div className={analysisTextBlockClass}>{report.summary}</div>
        <div className="status-box">
          <strong>判断理由</strong>
          <span>{report.score.reason}</span>
        </div>
      </DisplaySectionCard>

      <DisplaySectionCard
        className="grid gap-4 p-5 md:p-6"
        compact
        description="这里把已有优势和待补缺口放在同一层，帮助用户理解为什么当前简历会得到这个结论。"
        eyebrow="依据层"
        title="判断依据"
        titleAs="h3">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="grid gap-3">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              已有优势
            </h4>
            <ul className="muted-list">
              {report.strengths.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="grid gap-3">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              待补缺口
            </h4>
            <ul className="muted-list">
              {report.gaps.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </DisplaySectionCard>

      <DisplaySectionCard
        className="grid gap-4 p-5 md:p-6"
        compact
        description="风险提示不是为了制造焦虑，而是提前告诉用户“不改会发生什么”。"
        eyebrow="风险层"
        title="风险提示"
        titleAs="h3">
        <ul className="muted-list">
          {report.risks.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </DisplaySectionCard>

      <DisplaySectionCard
        className="grid gap-4 p-5 md:p-6"
        compact
        description="建议动作会尽量指向简历模块，为后续 diff / apply 做准备，也方便用户在确认原因后再执行。"
        eyebrow="行动层"
        title="建议动作"
        titleAs="h3">
        <div className="stack">
          {report.suggestions.map((item) => {
            const suggestionModule = item.module

            return (
              <DisplaySurfaceCard
                as="section"
                className="stack p-5 md:p-6"
                key={item.key}>
                <DisplaySectionIntro
                  compact
                  description={item.reason}
                  eyebrow={
                    suggestionModule
                      ? `建议模块：${suggestionModule}`
                      : '建议模块：通用判断'
                  }
                  title={item.title}
                  titleAs="h4"
                />
                <ul className="muted-list">
                  {item.actions.map((action) => (
                    <li key={`${item.key}-${action}`}>{action}</li>
                  ))}
                </ul>
                {suggestionModule ? (
                  <div className="dashboard-entry-actions">
                    <Button
                      onPress={() => onLinkSuggestionModule(suggestionModule)}
                      size="sm"
                      type="button"
                      variant="outline">
                      {`定位到 ${suggestionModule} 改写模块`}
                    </Button>
                  </div>
                ) : null}
              </DisplaySurfaceCard>
            )
          })}
        </div>
      </DisplaySectionCard>

      {report.sections.length > 0 ? (
        <DisplaySectionCard
          className="grid gap-4 p-5 md:p-6"
          compact
          description="兼容缓存阅读面板的过渡结构，便于后续继续统一报告阅读体验。"
          eyebrow="兼容层"
          title="附加阅读段落"
          titleAs="h3">
          <div className="grid gap-4 lg:grid-cols-2">
            {report.sections.map((section) => (
              <DisplaySurfaceCard
                as="article"
                className={analysisSectionCardClass}
                key={`legacy-${section.key}`}>
                <DisplaySectionIntro
                  compact
                  description="兼容缓存阅读面板的过渡结构。"
                  title={section.title}
                  titleAs="h4"
                />
                <ul className="muted-list">
                  {section.bullets.map((bullet) => (
                    <li key={`${section.key}-${bullet}`}>{bullet}</li>
                  ))}
                </ul>
              </DisplaySurfaceCard>
            ))}
          </div>
        </DisplaySectionCard>
      ) : null}
    </>
  )
}

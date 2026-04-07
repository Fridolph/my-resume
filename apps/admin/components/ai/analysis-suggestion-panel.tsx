'use client';

import { Button, Checkbox } from '@heroui/react';
import {
  DisplayPill,
  DisplaySectionIntro,
  DisplaySurfaceCard,
} from '@my-resume/ui/display';

import type {
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationResult,
} from '../../lib/ai-workbench-types';

interface AnalysisSuggestionPanelProps {
  applyPending: boolean;
  linkedModule: AiResumeOptimizationChangedModule | null;
  onApplySuggestion: () => void;
  onToggleSelectedModule: (module: AiResumeOptimizationChangedModule) => void;
  selectedModules: AiResumeOptimizationChangedModule[];
  suggestion: AiResumeOptimizationResult;
}

export function AnalysisSuggestionPanel({
  applyPending,
  linkedModule,
  onApplySuggestion,
  onToggleSelectedModule,
  selectedModules,
  suggestion,
}: AnalysisSuggestionPanelProps) {
  return (
    <>
      <DisplaySurfaceCard className="grid gap-4">
        <DisplaySectionIntro
          compact
          description="服务端已把 AI 返回的结构化 patch 合并回当前 StandardResume，并完成校验。"
          eyebrow="结构化建议"
          title="可一键应用的草稿建议"
        />
        <div className="dashboard-badge-row">
          {suggestion.changedModules.map((module) => (
            <DisplayPill key={module}>模块：{module}</DisplayPill>
          ))}
          <DisplayPill>
            Provider：{suggestion.providerSummary.provider} /{' '}
            {suggestion.providerSummary.model}
          </DisplayPill>
        </div>
        <div className="analysis-text-block">{suggestion.summary}</div>
        {suggestion.focusAreas.length > 0 ? (
          <ul className="muted-list">
            {suggestion.focusAreas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </DisplaySurfaceCard>

      <div className="grid gap-4">
        {suggestion.moduleDiffs.map((moduleDiff) => {
          const checked = selectedModules.includes(moduleDiff.module);

          return (
            <DisplaySurfaceCard
              as="article"
              className={`analysis-section-card${linkedModule === moduleDiff.module ? ' is-linked-module' : ''}`}
              id={`module-diff-${moduleDiff.module}`}
              key={moduleDiff.module}
            >
              <div className="module-diff-header">
                <DisplaySectionIntro
                  compact
                  description={moduleDiff.reason}
                  eyebrow={`模块：${moduleDiff.module}`}
                  title={moduleDiff.title}
                  titleAs="h3"
                />
                <Checkbox
                  className="module-check"
                  isSelected={checked}
                  onChange={() => onToggleSelectedModule(moduleDiff.module)}
                >
                  {`应用模块：${moduleDiff.module}`}
                </Checkbox>
              </div>

              <div className="module-diff-stack">
                {moduleDiff.entries.map((entry) => (
                  <div className="module-diff-entry" key={entry.key}>
                    <strong>{entry.label}</strong>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="status-box">
                        <strong>当前草稿</strong>
                        <span>{entry.before}</span>
                      </div>
                      <div className="status-box">
                        <strong>建议稿</strong>
                        <span>{entry.after}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </DisplaySurfaceCard>
          );
        })}
      </div>

      <DisplaySurfaceCard className="card stack">
        <DisplaySectionIntro
          compact
          description="只有勾选的模块会被服务端写回当前草稿，避免前端整份覆盖。"
          eyebrow="草稿应用"
          title="将已选模块写回当前草稿"
          titleAs="h3"
        />
        <div className="dashboard-inline-note">
          当前已选择 {selectedModules.length} / {suggestion.changedModules.length} 个模块。
        </div>
        <div className="dashboard-entry-actions">
          <Button
            isDisabled={applyPending || selectedModules.length === 0}
            onClick={onApplySuggestion}
            size="md"
            type="button"
            variant="primary"
          >
            {applyPending ? '正在应用到草稿...' : '应用已选模块到当前草稿'}
          </Button>
        </div>
      </DisplaySurfaceCard>
    </>
  );
}

'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';

import {
  applyAiResumeOptimization,
  generateAiResumeOptimization,
  triggerAiWorkbenchAnalysis,
} from '../../lib/ai-workbench-api';
import type {
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationResult,
  ApplyAiResumeOptimizationResult,
  AiWorkbenchLocale,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
  AiWorkbenchScenario,
} from '../../lib/ai-workbench-types';
import { AnalysisForm } from './analysis-form';
import { AnalysisReportDetails } from './analysis-report-details';
import { AnalysisReportOverview } from './analysis-report-overview';
import { AnalysisSuggestionPanel } from './analysis-suggestion-panel';

interface AiAnalysisPanelProps {
  accessToken: string;
  apiBaseUrl: string;
  applyResumeOptimization?: typeof applyAiResumeOptimization;
  canAnalyze: boolean;
  content: string;
  generateResumeOptimization?: typeof generateAiResumeOptimization;
  helperMessage?: string | null;
  inputAccessory?: ReactNode;
  onDraftApplied?: (snapshot: ApplyAiResumeOptimizationResult) => void;
  onContentChange: (value: string) => void;
  runtimeSummary: AiWorkbenchRuntimeSummary;
  triggerAnalysis?: typeof triggerAiWorkbenchAnalysis;
}

function renderReadOnlyState(inputAccessory?: ReactNode) {
  return (
    <section className="card stack">
      {inputAccessory ? <div className="stack">{inputAccessory}</div> : null}
      <div>
        <p className="eyebrow">真实分析</p>
        <h2>当前角色只读</h2>
        <p className="muted">只有管理员可触发真实分析并写入新的报告结果。</p>
      </div>
      <div className="readonly-box">
        viewer 当前只保留缓存报告体验，真实分析触发入口会在管理员链路中继续开放。
      </div>
    </section>
  );
}

export function AiAnalysisPanel({
  accessToken,
  apiBaseUrl,
  applyResumeOptimization = applyAiResumeOptimization,
  canAnalyze,
  content,
  generateResumeOptimization = generateAiResumeOptimization,
  helperMessage,
  inputAccessory,
  onDraftApplied,
  onContentChange,
  runtimeSummary,
  triggerAnalysis = triggerAiWorkbenchAnalysis,
}: AiAnalysisPanelProps) {
  const [scenario, setScenario] = useState<AiWorkbenchScenario>('resume-review');
  const [locale, setLocale] = useState<AiWorkbenchLocale>('zh');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<AiWorkbenchReport | null>(null);
  const [suggestionPending, setSuggestionPending] = useState(false);
  const [suggestionErrorMessage, setSuggestionErrorMessage] = useState<string | null>(
    null,
  );
  const [suggestion, setSuggestion] = useState<AiResumeOptimizationResult | null>(
    null,
  );
  const [selectedModules, setSelectedModules] = useState<
    AiResumeOptimizationChangedModule[]
  >([]);
  const [linkedModule, setLinkedModule] =
    useState<AiResumeOptimizationChangedModule | null>(null);
  const [moduleLinkMessage, setModuleLinkMessage] = useState<string | null>(null);
  const [applyPending, setApplyPending] = useState(false);
  const [applyFeedbackMessage, setApplyFeedbackMessage] = useState<string | null>(
    null,
  );

  if (!canAnalyze) {
    return renderReadOnlyState(inputAccessory);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedContent = content.trim();

    if (!normalizedContent) {
      setErrorMessage('请先输入分析内容，或先通过文件提取生成输入文本。');
      setReport(null);
      return;
    }

    setPending(true);
    setErrorMessage(null);
    setApplyFeedbackMessage(null);

    try {
      const result = await triggerAnalysis({
        apiBaseUrl,
        accessToken,
        scenario,
        locale,
        content: normalizedContent,
      });

      setReport(result.report);
    } catch (error) {
      setReport(null);
      setErrorMessage(
        error instanceof Error ? error.message : '真实分析触发失败，请稍后重试',
      );
    } finally {
      setPending(false);
    }
  }

  async function handleGenerateSuggestion() {
    const normalizedContent = content.trim();

    if (!normalizedContent) {
      setSuggestionErrorMessage('请先输入 JD 或优化方向，再生成结构化建议。');
      setSuggestion(null);
      return;
    }

    if (scenario !== 'resume-review') {
      setSuggestionErrorMessage('结构化简历建议当前只支持“简历优化建议”场景。');
      setSuggestion(null);
      return;
    }

    setSuggestionPending(true);
    setSuggestionErrorMessage(null);
    setApplyFeedbackMessage(null);
    setModuleLinkMessage(null);

    try {
      const result = await generateResumeOptimization({
        apiBaseUrl,
        accessToken,
        instruction: normalizedContent,
        locale,
      });

      setSuggestion(result);
      setSelectedModules(result.changedModules);
      setLinkedModule(null);
    } catch (error) {
      setSuggestion(null);
      setSelectedModules([]);
      setLinkedModule(null);
      setSuggestionErrorMessage(
        error instanceof Error ? error.message : '结构化简历建议生成失败，请稍后重试',
      );
    } finally {
      setSuggestionPending(false);
    }
  }

  function toggleSelectedModule(module: AiResumeOptimizationChangedModule) {
    setSelectedModules((currentModules) =>
      currentModules.includes(module)
        ? currentModules.filter((item) => item !== module)
        : [...currentModules, module],
    );
  }

  function handleLinkSuggestionModule(module: AiResumeOptimizationChangedModule) {
    if (!suggestion) {
      setModuleLinkMessage('请先生成结构化简历建议，再定位到具体改写模块。');
      return;
    }

    const hasModuleDiff = suggestion.moduleDiffs.some((item) => item.module === module);

    if (!hasModuleDiff) {
      setModuleLinkMessage(`当前建议稿中还没有 ${module} 模块的可应用改写。`);
      return;
    }

    setSelectedModules((currentModules) =>
      currentModules.includes(module) ? currentModules : [...currentModules, module],
    );
    setLinkedModule(module);
    setModuleLinkMessage(`已定位到 ${module} 改写模块，可继续确认并应用。`);

    if (typeof document !== 'undefined') {
      const target = document.getElementById(`module-diff-${module}`);
      if (typeof target?.scrollIntoView === 'function') {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  }

  async function handleApplySuggestion() {
    if (!suggestion) {
      return;
    }

    if (selectedModules.length === 0) {
      setSuggestionErrorMessage('请至少勾选一个要应用到草稿的模块。');
      return;
    }

    setApplyPending(true);
    setSuggestionErrorMessage(null);
    setApplyFeedbackMessage(null);
    setModuleLinkMessage(null);

    try {
      const nextSnapshot = await applyResumeOptimization({
        apiBaseUrl,
        accessToken,
        draftUpdatedAt: suggestion.applyPayload.draftUpdatedAt,
        modules: selectedModules,
        patch: suggestion.applyPayload.patch,
      });

      onDraftApplied?.(nextSnapshot);

      setApplyFeedbackMessage(
        `已将 ${selectedModules.length} 个模块应用到当前草稿。公开站内容不会自动变化，仍需手动发布。`,
      );
    } catch (error) {
      setSuggestionErrorMessage(
        error instanceof Error ? error.message : 'AI 建议稿应用失败，请稍后重试',
      );
    } finally {
      setApplyPending(false);
    }
  }

  return (
    <section className="card stack">
      <div>
        <p className="eyebrow">真实分析</p>
        <h2>输入内容并触发真实分析</h2>
        <p className="muted">
          当前阶段先保留同步最小闭环，让管理员直接验证 Provider、场景和结果结构。
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <AnalysisForm
          applyFeedbackMessage={applyFeedbackMessage}
          applyPending={applyPending}
          content={content}
          errorMessage={errorMessage}
          helperMessage={helperMessage}
          inputAccessory={inputAccessory}
          locale={locale}
          moduleLinkMessage={moduleLinkMessage}
          onChangeLocale={setLocale}
          onContentChange={onContentChange}
          onGenerateSuggestion={() => void handleGenerateSuggestion()}
          onSubmit={(event) => void handleSubmit(event)}
          onUpdateScenario={setScenario}
          pending={pending}
          scenario={scenario}
          suggestionErrorMessage={suggestionErrorMessage}
          suggestionPending={suggestionPending}
        />

        <div className="stack self-start">
          <AnalysisReportOverview
            report={report}
            runtimeSummary={runtimeSummary}
          />

          {report ? (
            <AnalysisReportDetails
              onLinkSuggestionModule={handleLinkSuggestionModule}
              report={report}
            />
          ) : null}

          {suggestion ? (
            <AnalysisSuggestionPanel
              applyPending={applyPending}
              linkedModule={linkedModule}
              onApplySuggestion={() => void handleApplySuggestion()}
              onToggleSelectedModule={toggleSelectedModule}
              selectedModules={selectedModules}
              suggestion={suggestion}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}

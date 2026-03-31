'use client';

import {
  DisplayPill,
  DisplaySectionIntro,
  DisplaySurfaceCard,
} from '@my-resume/ui/display';
import { useState } from 'react';

import {
  applyAiResumeOptimization,
  generateAiResumeOptimization,
  triggerAiWorkbenchAnalysis,
} from '../lib/ai-workbench-api';
import {
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationResult,
  AiWorkbenchLocale,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
  AiWorkbenchScenario,
} from '../lib/ai-workbench-types';

interface AiAnalysisPanelProps {
  accessToken: string;
  apiBaseUrl: string;
  applyResumeOptimization?: typeof applyAiResumeOptimization;
  canAnalyze: boolean;
  content: string;
  helperMessage?: string | null;
  onContentChange: (value: string) => void;
  runtimeSummary: AiWorkbenchRuntimeSummary;
  generateResumeOptimization?: typeof generateAiResumeOptimization;
  triggerAnalysis?: typeof triggerAiWorkbenchAnalysis;
}

const scenarioOptions: Array<{
  value: AiWorkbenchScenario;
  label: string;
}> = [
  {
    value: 'jd-match',
    label: 'JD 匹配分析',
  },
  {
    value: 'resume-review',
    label: '简历优化建议',
  },
  {
    value: 'offer-compare',
    label: 'Offer 对比建议',
  },
];

const localeOptions: Array<{
  value: AiWorkbenchLocale;
  label: string;
}> = [
  {
    value: 'zh',
    label: '中文',
  },
  {
    value: 'en',
    label: 'English',
  },
];

function formatScenario(scenario: AiWorkbenchScenario): string {
  return (
    scenarioOptions.find((item) => item.value === scenario)?.label ?? scenario
  );
}

function formatLocale(locale: AiWorkbenchLocale): string {
  return locale === 'zh' ? '中文' : 'English';
}

function formatGenerator(generator: AiWorkbenchReport['generator']): string {
  return generator === 'ai-provider' ? '真实 Provider' : '缓存结果';
}

function formatScore(report: AiWorkbenchReport): string {
  return `评分：${report.score.value} / 100`;
}

export function AiAnalysisPanel({
  accessToken,
  apiBaseUrl,
  applyResumeOptimization = applyAiResumeOptimization,
  canAnalyze,
  content,
  helperMessage,
  onContentChange,
  runtimeSummary,
  generateResumeOptimization = generateAiResumeOptimization,
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
  const [suggestion, setSuggestion] =
    useState<AiResumeOptimizationResult | null>(null);
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
    return (
      <section className="card stack">
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

    try {
      await applyResumeOptimization({
        apiBaseUrl,
        accessToken,
        draftUpdatedAt: suggestion.applyPayload.draftUpdatedAt,
        modules: selectedModules,
        patch: suggestion.applyPayload.patch,
      });

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

      <form className="stack" onSubmit={(event) => void handleSubmit(event)}>
        <div className="form-grid">
          <label className="field">
            <span>分析场景</span>
            <select
              onChange={(event) =>
                setScenario(event.target.value as AiWorkbenchScenario)
              }
              value={scenario}
            >
              {scenarioOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>输出语言</span>
            <select
              onChange={(event) =>
                setLocale(event.target.value as AiWorkbenchLocale)
              }
              value={locale}
            >
              {localeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>分析输入</span>
          <textarea
            className="preview-textarea"
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="可直接粘贴 JD、简历段落或 offer 信息；也可以先从上方文件提取区同步文本。"
            value={content}
          />
        </label>

        {helperMessage ? (
          <div className="dashboard-inline-note">{helperMessage}</div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {suggestionErrorMessage ? (
          <p className="error-text">{suggestionErrorMessage}</p>
        ) : null}
        {moduleLinkMessage ? (
          <p className="dashboard-inline-note">{moduleLinkMessage}</p>
        ) : null}
        {applyFeedbackMessage ? (
          <p className="dashboard-inline-note">{applyFeedbackMessage}</p>
        ) : null}

        <div className="dashboard-entry-actions">
          <button disabled={pending} type="submit">
            {pending ? '正在生成分析...' : '开始真实分析'}
          </button>
          <button
            disabled={suggestionPending || applyPending}
            onClick={() => void handleGenerateSuggestion()}
            type="button"
          >
            {suggestionPending ? '正在生成建议稿...' : '生成结构化简历建议'}
          </button>
        </div>
      </form>

      {report ? (
        <div className="preview-stack">
          <div className="stack">
            <DisplaySectionIntro
              compact
              description="当前展示的是管理员刚触发的同步分析结果，后续再继续扩展历史记录与更完整的结果阅读。"
              eyebrow="分析结果"
              title="最近一次结果"
            />
            <div className="dashboard-badge-row">
              <DisplayPill>场景：{formatScenario(report.scenario)}</DisplayPill>
              <DisplayPill>语言：{formatLocale(report.locale)}</DisplayPill>
              <DisplayPill>来源：{formatGenerator(report.generator)}</DisplayPill>
              <DisplayPill>
                Provider：{runtimeSummary.provider} / {runtimeSummary.model}
              </DisplayPill>
            </div>
          </div>

          <DisplaySurfaceCard className="analysis-summary-card">
            <DisplaySectionIntro
              compact
              description={report.inputPreview}
              eyebrow="结论层"
              title="模型判断摘要"
              titleAs="h3"
            />
            <div className="analysis-text-block">{report.summary}</div>
            <div className="info-grid">
              <div className="status-box">
                <strong>{formatScore(report)}</strong>
                <span>{report.score.label}</span>
              </div>
              <div className="status-box">
                <strong>判断理由</strong>
                <span>{report.score.reason}</span>
              </div>
            </div>
          </DisplaySurfaceCard>

          <div className="analysis-section-grid">
            <DisplaySurfaceCard as="article" className="analysis-section-card">
              <DisplaySectionIntro
                compact
                description="这里展示当前输入已经具备的优势，帮助用户判断“哪些内容不该被误改”。"
                title="已有优势"
                titleAs="h3"
              />
              <ul className="muted-list">
                {report.strengths.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DisplaySurfaceCard>

            <DisplaySurfaceCard as="article" className="analysis-section-card">
              <DisplaySectionIntro
                compact
                description="这些缺口是 AI 判断当前输入还不够有说服力的地方。"
                title="待补缺口"
                titleAs="h3"
              />
              <ul className="muted-list">
                {report.gaps.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DisplaySurfaceCard>

            <DisplaySurfaceCard as="article" className="analysis-section-card">
              <DisplaySectionIntro
                compact
                description="风险提示不是为了制造焦虑，而是提前告诉用户“不改会发生什么”。"
                title="风险提示"
                titleAs="h3"
              />
              <ul className="muted-list">
                {report.risks.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </DisplaySurfaceCard>

            <DisplaySurfaceCard as="article" className="analysis-section-card">
              <DisplaySectionIntro
                compact
                description="建议动作会尽量指向简历模块，为后续 diff / apply 做准备。"
                title="建议动作"
                titleAs="h3"
              />
              <div className="stack">
                {report.suggestions.map((item) => (
                  (() => {
                    const suggestionModule = item.module;

                    return (
                      <DisplaySurfaceCard
                        as="section"
                        className="card stack"
                        key={item.key}
                      >
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
                            <button
                              className="secondary-button"
                              onClick={() =>
                                handleLinkSuggestionModule(suggestionModule)
                              }
                              type="button"
                            >
                              {`定位到 ${suggestionModule} 改写模块`}
                            </button>
                          </div>
                        ) : null}
                      </DisplaySurfaceCard>
                    );
                  })()
                ))}
              </div>
            </DisplaySurfaceCard>

            {report.sections.map((section) => (
              <DisplaySurfaceCard
                as="article"
                className="analysis-section-card"
                key={`legacy-${section.key}`}
              >
                <DisplaySectionIntro
                  compact
                  description="兼容缓存阅读面板的过渡结构。"
                  title={section.title}
                  titleAs="h3"
                />
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

      {suggestion ? (
        <div className="preview-stack">
          <div className="stack">
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
          </div>

          <DisplaySurfaceCard className="analysis-summary-card">
            <DisplaySectionIntro
              compact
              description="当前开源版先只做结构化改写建议、模块级确认和服务端 apply，不继续扩张到历史与多版本管理。"
              eyebrow="建议摘要"
              title="AI 建议稿说明"
              titleAs="h3"
            />
            <div className="analysis-text-block">{suggestion.summary}</div>
            {suggestion.focusAreas.length > 0 ? (
              <ul className="muted-list">
                {suggestion.focusAreas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </DisplaySurfaceCard>

          <div className="analysis-section-grid">
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
                    <label className="module-check">
                      <input
                        checked={checked}
                        onChange={() => toggleSelectedModule(moduleDiff.module)}
                        type="checkbox"
                      />
                      <span>{`应用模块：${moduleDiff.module}`}</span>
                    </label>
                  </div>

                  <div className="module-diff-stack">
                    {moduleDiff.entries.map((entry) => (
                      <div className="module-diff-entry" key={entry.key}>
                        <strong>{entry.label}</strong>
                        <div className="module-diff-grid">
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
              当前已选择 {selectedModules.length} / {suggestion.changedModules.length}{' '}
              个模块。
            </div>
            <div className="dashboard-entry-actions">
              <button
                disabled={applyPending || selectedModules.length === 0}
                onClick={() => void handleApplySuggestion()}
                type="button"
              >
                {applyPending ? '正在应用到草稿...' : '应用已选模块到当前草稿'}
              </button>
            </div>
          </DisplaySurfaceCard>
        </div>
      ) : null}
    </section>
  );
}

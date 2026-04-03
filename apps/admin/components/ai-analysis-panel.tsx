'use client';

import { Button, Checkbox, ListBox, Select, TextArea } from '@heroui/react';
import {
  DisplayPill,
  DisplaySectionIntro,
  DisplaySurfaceCard,
} from '@my-resume/ui/display';
import { ReactNode, useState } from 'react';

import {
  applyAiResumeOptimization,
  generateAiResumeOptimization,
  triggerAiWorkbenchAnalysis,
} from '../lib/ai-workbench-api';
import {
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationResult,
  ApplyAiResumeOptimizationResult,
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
  generateResumeOptimization?: typeof generateAiResumeOptimization;
  helperMessage?: string | null;
  inputAccessory?: ReactNode;
  onDraftApplied?: (snapshot: ApplyAiResumeOptimizationResult) => void;
  onContentChange: (value: string) => void;
  runtimeSummary: AiWorkbenchRuntimeSummary;
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
  return scenarioOptions.find((item) => item.value === scenario)?.label ?? scenario;
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
        <div className="stack self-start">
          {inputAccessory ? <div className="stack">{inputAccessory}</div> : null}

          <form
            className="stack rounded-[1.75rem] border border-zinc-200/80 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"
            onSubmit={(event) => void handleSubmit(event)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span>分析场景</span>
                <Select
                  aria-label="分析场景"
                  fullWidth
                  onSelectionChange={(key) =>
                    setScenario(String(key) as AiWorkbenchScenario)
                  }
                  selectedKey={scenario}
                  variant="secondary"
                >
                  <Select.Trigger aria-label="分析场景">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {scenarioOptions.map((option) => (
                        <ListBox.Item
                          id={option.value}
                          key={option.value}
                          textValue={option.label}
                        >
                          {option.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </label>

              <label className="field">
                <span>输出语言</span>
                <Select
                  aria-label="输出语言"
                  fullWidth
                  onSelectionChange={(key) =>
                    setLocale(String(key) as AiWorkbenchLocale)
                  }
                  selectedKey={locale}
                  variant="secondary"
                >
                  <Select.Trigger aria-label="输出语言">
                    <Select.Value />
                    <Select.Indicator />
                  </Select.Trigger>
                  <Select.Popover>
                    <ListBox>
                      {localeOptions.map((option) => (
                        <ListBox.Item
                          id={option.value}
                          key={option.value}
                          textValue={option.label}
                        >
                          {option.label}
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </label>
            </div>

            <label className="field">
              <span>分析输入</span>
              <TextArea
                className="min-h-[20rem] font-mono leading-6"
                fullWidth
                onChange={(event) => onContentChange(event.target.value)}
                placeholder="可直接粘贴 JD、简历段落或 offer 信息；也可以先从上方文件提取区同步文本。"
                value={content}
                variant="secondary"
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
              <Button
                isDisabled={pending}
                size="md"
                type="submit"
                variant="primary"
              >
                {pending ? '正在生成分析...' : '开始真实分析'}
              </Button>
              <Button
                isDisabled={suggestionPending || applyPending}
                onClick={() => void handleGenerateSuggestion()}
                size="md"
                type="button"
                variant="outline"
              >
                {suggestionPending ? '正在生成建议稿...' : '生成结构化简历建议'}
              </Button>
            </div>
          </form>
        </div>

        <div className="stack self-start">
          <DisplaySurfaceCard className="grid gap-4">
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

          {report ? (
            <>
              <DisplaySurfaceCard className="grid gap-4">
                <DisplaySectionIntro
                  compact
                  description="先给出面向用户的整体判断，再展开为什么这样判断。这样更适合简历修改和面试准备。"
                  eyebrow="结论层"
                  title="结论摘要"
                  titleAs="h3"
                />
                <div className="analysis-text-block">{report.summary}</div>
                <div className="status-box">
                  <strong>判断理由</strong>
                  <span>{report.score.reason}</span>
                </div>
              </DisplaySurfaceCard>

              <DisplaySurfaceCard className="grid gap-4">
                <DisplaySectionIntro
                  compact
                  description="这里把已有优势和待补缺口放在同一层，帮助用户理解为什么当前简历会得到这个结论。"
                  eyebrow="依据层"
                  title="判断依据"
                  titleAs="h3"
                />
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
              </DisplaySurfaceCard>

              <DisplaySurfaceCard className="grid gap-4">
                <DisplaySectionIntro
                  compact
                  description="风险提示不是为了制造焦虑，而是提前告诉用户“不改会发生什么”。"
                  eyebrow="风险层"
                  title="风险提示"
                  titleAs="h3"
                />
                <ul className="muted-list">
                  {report.risks.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </DisplaySurfaceCard>

              <DisplaySurfaceCard className="grid gap-4">
                <DisplaySectionIntro
                  compact
                  description="建议动作会尽量指向简历模块，为后续 diff / apply 做准备，也方便用户在确认原因后再执行。"
                  eyebrow="行动层"
                  title="建议动作"
                  titleAs="h3"
                />
                <div className="stack">
                  {report.suggestions.map((item) => {
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
                            <Button
                              onClick={() =>
                                handleLinkSuggestionModule(suggestionModule)
                              }
                              size="sm"
                              type="button"
                              variant="outline"
                            >
                              {`定位到 ${suggestionModule} 改写模块`}
                            </Button>
                          </div>
                        ) : null}
                      </DisplaySurfaceCard>
                    );
                  })}
                </div>
              </DisplaySurfaceCard>

              {report.sections.length > 0 ? (
                <DisplaySurfaceCard className="grid gap-4">
                  <DisplaySectionIntro
                    compact
                    description="兼容缓存阅读面板的过渡结构，便于后续继续统一报告阅读体验。"
                    eyebrow="兼容层"
                    title="附加阅读段落"
                    titleAs="h3"
                  />
                  <div className="grid gap-4 lg:grid-cols-2">
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
                </DisplaySurfaceCard>
              ) : null}
            </>
          ) : null}

          {suggestion ? (
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
                          onChange={() => toggleSelectedModule(moduleDiff.module)}
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
                  当前已选择 {selectedModules.length} / {suggestion.changedModules.length}{' '}
                  个模块。
                </div>
                <div className="dashboard-entry-actions">
                  <Button
                    isDisabled={applyPending || selectedModules.length === 0}
                    onClick={() => void handleApplySuggestion()}
                    size="md"
                    type="button"
                    variant="primary"
                  >
                    {applyPending ? '正在应用到草稿...' : '应用已选模块到当前草稿'}
                  </Button>
                </div>
              </DisplaySurfaceCard>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

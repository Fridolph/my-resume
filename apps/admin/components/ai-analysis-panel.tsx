'use client';

import {
  DisplayPill,
  DisplaySectionIntro,
  DisplaySurfaceCard,
} from '@my-resume/ui/display';
import { useState } from 'react';

import {
  triggerAiWorkbenchAnalysis,
} from '../lib/ai-workbench-api';
import {
  AiWorkbenchLocale,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
  AiWorkbenchScenario,
} from '../lib/ai-workbench-types';

interface AiAnalysisPanelProps {
  accessToken: string;
  apiBaseUrl: string;
  canAnalyze: boolean;
  content: string;
  helperMessage?: string | null;
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

export function AiAnalysisPanel({
  accessToken,
  apiBaseUrl,
  canAnalyze,
  content,
  helperMessage,
  onContentChange,
  runtimeSummary,
  triggerAnalysis = triggerAiWorkbenchAnalysis,
}: AiAnalysisPanelProps) {
  const [scenario, setScenario] = useState<AiWorkbenchScenario>('resume-review');
  const [locale, setLocale] = useState<AiWorkbenchLocale>('zh');
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [report, setReport] = useState<AiWorkbenchReport | null>(null);

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

        <div className="dashboard-entry-actions">
          <button disabled={pending} type="submit">
            {pending ? '正在生成分析...' : '开始真实分析'}
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
              eyebrow="摘要"
              title="模型返回摘要"
              titleAs="h3"
            />
            <div className="analysis-text-block">{report.summary}</div>
          </DisplaySurfaceCard>

          <div className="analysis-section-grid">
            {report.sections.map((section) => (
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

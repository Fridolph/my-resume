import type { StandardResume } from './resume-types';

export type AiWorkbenchScenario =
  | 'jd-match'
  | 'resume-review'
  | 'offer-compare';

export interface AiWorkbenchRuntimeSummary {
  provider: string;
  model: string;
  mode: string;
  supportedScenarios: readonly AiWorkbenchScenario[];
}

export type AiWorkbenchLocale = 'zh' | 'en';
export type AiWorkbenchReportGenerator = 'mock-cache' | 'ai-provider';
export type AiAnalysisSuggestionModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights';

export interface AiWorkbenchScore {
  /**
   * 面向用户的快速分值信号，用于帮助判断“当前内容离目标还差多少”。
   */
  value: number;
  label: string;
  reason: string;
}

export interface AiWorkbenchSuggestion {
  key: string;
  title: string;
  module?: AiAnalysisSuggestionModule;
  /**
   * reason 直接面向用户解释“为什么建议改这里”。
   */
  reason: string;
  actions: string[];
}

export interface AiWorkbenchReportSection {
  key: string;
  title: string;
  bullets: string[];
}

export interface AiWorkbenchReport {
  reportId: string;
  cacheKey: string;
  scenario: AiWorkbenchScenario;
  locale: AiWorkbenchLocale;
  sourceHash: string;
  inputPreview: string;
  summary: string;
  score: AiWorkbenchScore;
  strengths: string[];
  gaps: string[];
  risks: string[];
  suggestions: AiWorkbenchSuggestion[];
  sections: AiWorkbenchReportSection[];
  generator: AiWorkbenchReportGenerator;
  createdAt: string;
}

export interface AiWorkbenchCachedReportSummary {
  reportId: string;
  scenario: AiWorkbenchScenario;
  locale: AiWorkbenchLocale;
  summary: string;
  generator: AiWorkbenchReportGenerator;
  createdAt: string;
}

export interface TriggerAiWorkbenchAnalysisResult {
  cached: boolean;
  report: AiWorkbenchReport;
}

export type AiResumeOptimizationChangedModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights';

export interface AiResumeOptimizationResult {
  summary: string;
  focusAreas: string[];
  changedModules: AiResumeOptimizationChangedModule[];
  suggestedResume: StandardResume;
  providerSummary: {
    provider: string;
    model: string;
    mode: string;
  };
}

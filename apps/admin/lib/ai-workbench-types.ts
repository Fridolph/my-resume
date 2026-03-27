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
  sections: AiWorkbenchReportSection[];
  generator: AiWorkbenchReportGenerator;
  createdAt: string;
}

export interface TriggerAiWorkbenchAnalysisResult {
  cached: boolean;
  report: AiWorkbenchReport;
}

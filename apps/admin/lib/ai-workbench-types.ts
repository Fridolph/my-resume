export type AiWorkbenchScenario =
  | 'jd-match'
  | 'resume-review'
  | 'offer-compare';

export interface AiWorkbenchRuntimeSummary {
  provider: string;
  model: string;
  mode: string;
  supportedScenarios: AiWorkbenchScenario[];
}

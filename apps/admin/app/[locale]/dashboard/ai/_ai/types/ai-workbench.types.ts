import type {
  LocalizedText,
  ResumeDraftSnapshot,
  ResumeHighlightItem,
} from '../../../resume/_resume/types/resume.types'

export type AiWorkbenchScenario = 'jd-match' | 'resume-review' | 'offer-compare'

export interface AiWorkbenchRuntimeSummary {
  provider: string
  model: string
  mode: string
  supportedScenarios: readonly AiWorkbenchScenario[]
}

export type AiWorkbenchLocale = 'zh' | 'en'
export type AiWorkbenchReportGenerator = 'mock-cache' | 'ai-provider'
export type AiAnalysisSuggestionModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights'

export interface AiWorkbenchScore {
  /**
   * 面向用户的快速分值信号，用于帮助判断“当前内容离目标还差多少”。
   */
  value: number
  label: string
  reason: string
}

export interface AiWorkbenchSuggestion {
  key: string
  title: string
  module?: AiAnalysisSuggestionModule
  /**
   * reason 直接面向用户解释“为什么建议改这里”。
   */
  reason: string
  actions: string[]
}

export interface AiWorkbenchReportSection {
  key: string
  title: string
  bullets: string[]
}

export interface AiWorkbenchReport {
  reportId: string
  cacheKey: string
  scenario: AiWorkbenchScenario
  locale: AiWorkbenchLocale
  sourceHash: string
  inputPreview: string
  summary: string
  score: AiWorkbenchScore
  strengths: string[]
  gaps: string[]
  risks: string[]
  suggestions: AiWorkbenchSuggestion[]
  sections: AiWorkbenchReportSection[]
  generator: AiWorkbenchReportGenerator
  createdAt: string
}

export interface AiWorkbenchCachedReportSummary {
  reportId: string
  scenario: AiWorkbenchScenario
  locale: AiWorkbenchLocale
  summary: string
  generator: AiWorkbenchReportGenerator
  createdAt: string
}

export interface TriggerAiWorkbenchAnalysisResult {
  cached: boolean
  report: AiWorkbenchReport
  usageRecordId: string
}

export type AiUsageRecordOperationType = 'analysis-report' | 'resume-optimization'
export type AiUsageRecordStatus = 'succeeded' | 'failed'
export type AiUsageRecordFilterType = 'all' | AiUsageRecordOperationType

export interface AiUsageRecordSummary {
  id: string
  operationType: AiUsageRecordOperationType
  scenario: AiWorkbenchScenario
  locale: AiWorkbenchLocale
  inputPreview: string
  summary: string | null
  provider: string
  model: string
  mode: string
  generator: AiWorkbenchReportGenerator
  status: AiUsageRecordStatus
  relatedReportId: string | null
  relatedResultId: string | null
  errorMessage: string | null
  durationMs: number
  createdAt: string
  scoreLabel?: string
  scoreValue?: number
}

export interface AiUsageRecordDetail extends AiUsageRecordSummary {
  detail: unknown | null
}

export type AiResumeOptimizationChangedModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights'

export interface AiResumeOptimizationProfilePatch {
  headline?: LocalizedText
  summary?: LocalizedText
}

export interface AiResumeOptimizationExperiencePatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

export interface AiResumeOptimizationProjectPatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

export interface AiResumeOptimizationPatch {
  profile?: AiResumeOptimizationProfilePatch
  experiences?: AiResumeOptimizationExperiencePatch[]
  projects?: AiResumeOptimizationProjectPatch[]
  highlights?: ResumeHighlightItem[]
}

export interface AiResumeOptimizationDiffEntry {
  key: string
  label: string
  currentValue: string
  reason: string
  suggestion: string
  suggestedValue: string
}

export interface AiResumeOptimizationModuleDiff {
  module: AiResumeOptimizationChangedModule
  title: string
  reason: string
  entries: AiResumeOptimizationDiffEntry[]
}

export interface ApplyAiResumeOptimizationInput {
  apiBaseUrl: string
  accessToken: string
  resultId: string
  modules: AiResumeOptimizationChangedModule[]
}

export interface AiResumeOptimizationResult {
  resultId: string
  usageRecordId?: string
  locale: AiWorkbenchLocale
  source?: 'cache' | 'usage-record'
  canApply?: boolean
  summary: string
  focusAreas: string[]
  changedModules: AiResumeOptimizationChangedModule[]
  moduleDiffs: AiResumeOptimizationModuleDiff[]
  createdAt: string
  providerSummary: {
    provider: string
    model: string
    mode: string
  }
}

export type ApplyAiResumeOptimizationResult = ResumeDraftSnapshot

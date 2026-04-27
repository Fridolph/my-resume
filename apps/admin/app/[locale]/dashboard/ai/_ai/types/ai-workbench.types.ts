import type {
  LocalizedText,
  ResumeDraftSnapshot,
  ResumeHighlightItem,
} from '../../../resume/_resume/types/resume.types'

export type AiWorkbenchScenario = 'jd-match' | 'resume-review' | 'offer-compare'

/**
 * AI 工作台运行时摘要。
 */
export interface AiWorkbenchRuntimeSummary {
  provider: string
  model: string
  mode: string
  supportedScenarios: readonly AiWorkbenchScenario[]
}

/**
 * AI 工作台语言。
 */
export type AiWorkbenchLocale = 'zh' | 'en'

/**
 * 报告生成来源。
 */
export type AiWorkbenchReportGenerator = 'mock-cache' | 'ai-provider'

/**
 * 建议影响模块。
 */
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

/**
 * AI 建议条目。
 */
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

/**
 * AI 报告分节条目。
 */
export interface AiWorkbenchReportSection {
  key: string
  title: string
  bullets: string[]
}

/**
 * AI 工作台完整报告。
 */
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

/**
 * 缓存报告摘要。
 */
export interface AiWorkbenchCachedReportSummary {
  reportId: string
  scenario: AiWorkbenchScenario
  locale: AiWorkbenchLocale
  summary: string
  generator: AiWorkbenchReportGenerator
  createdAt: string
}

/**
 * 触发分析返回结果。
 */
export interface TriggerAiWorkbenchAnalysisResult {
  cached: boolean
  report: AiWorkbenchReport
  usageRecordId: string
}

/**
 * 使用记录操作类型。
 */
export type AiUsageRecordOperationType = 'analysis-report' | 'resume-optimization'

/**
 * 使用记录状态。
 */
export type AiUsageRecordStatus = 'succeeded' | 'failed'

/**
 * 使用记录过滤类型。
 */
export type AiUsageRecordFilterType = 'all' | AiUsageRecordOperationType

/**
 * 使用记录摘要。
 */
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

/**
 * 使用记录详情。
 */
export interface AiUsageRecordDetail extends AiUsageRecordSummary {
  detail: unknown | null
}

/**
 * 简历优化变更模块。
 */
export type AiResumeOptimizationChangedModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights'

export interface AiResumeOptimizationProfilePatch {
  headline?: LocalizedText
  summary?: LocalizedText
}

/**
 * 工作经历优化补丁。
 */
export interface AiResumeOptimizationExperiencePatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

/**
 * 项目优化补丁。
 */
export interface AiResumeOptimizationProjectPatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

/**
 * 简历优化总补丁。
 */
export interface AiResumeOptimizationPatch {
  profile?: AiResumeOptimizationProfilePatch
  experiences?: AiResumeOptimizationExperiencePatch[]
  projects?: AiResumeOptimizationProjectPatch[]
  highlights?: ResumeHighlightItem[]
}

/**
 * 优化差异条目。
 */
export interface AiResumeOptimizationDiffEntry {
  key: string
  label: string
  currentValue: string
  reason: string
  suggestion: string
  suggestedValue: string
}

/**
 * 优化模块差异。
 */
export interface AiResumeOptimizationModuleDiff {
  module: AiResumeOptimizationChangedModule
  title: string
  reason: string
  entries: AiResumeOptimizationDiffEntry[]
}

/**
 * 应用优化结果入参。
 */
export interface ApplyAiResumeOptimizationInput {
  apiBaseUrl: string
  accessToken: string
  resultId: string
  modules: AiResumeOptimizationChangedModule[]
}

/**
 * AI 简历优化结果。
 */
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

/**
 * 应用优化后的返回快照。
 */
export type ApplyAiResumeOptimizationResult = ResumeDraftSnapshot

import type {
  LocalizedText,
  ResumeDraftSnapshot,
  ResumeHighlightItem,
} from './resume.types'
import type { ApiRequestInput } from './client.types'

/**
 * AI 工作台场景
 */
export type AiWorkbenchScenario = 'jd-match' | 'resume-review' | 'offer-compare'

/**
 * AI 工作台语言
 */
export type AiWorkbenchLocale = 'zh' | 'en'

/**
 * 报告生成来源
 */
export type AiWorkbenchReportGenerator = 'mock-cache' | 'ai-provider'

/**
 * 建议影响模块
 */
export type AiAnalysisSuggestionModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights'

/**
 * AI 运行时摘要
 */
export interface AiWorkbenchRuntimeSummary {
  provider: string
  model: string
  mode: string
  supportedScenarios: readonly AiWorkbenchScenario[]
}

/**
 * 评分信息
 */
export interface AiWorkbenchScore {
  value: number
  label: string
  reason: string
}

/**
 * 建议项
 */
export interface AiWorkbenchSuggestion {
  key: string
  title: string
  module?: AiAnalysisSuggestionModule
  reason: string
  actions: string[]
}

/**
 * 报告分节
 */
export interface AiWorkbenchReportSection {
  key: string
  title: string
  bullets: string[]
}

/**
 * 工作台报告
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
 * 缓存报告摘要
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
 * 触发分析返回
 */
export interface TriggerAiWorkbenchAnalysisResult {
  cached: boolean
  report: AiWorkbenchReport
  usageRecordId: string
}

/**
 * AI 使用记录操作类型。
 */
export type AiUsageRecordOperationType = 'analysis-report' | 'resume-optimization'

/**
 * AI 使用记录状态。
 */
export type AiUsageRecordStatus = 'succeeded' | 'failed'

/**
 * AI 使用记录过滤类型。
 */
export type AiUsageRecordFilterType = 'all' | AiUsageRecordOperationType

/**
 * AI 使用记录摘要。
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
 * AI 使用记录详情。
 */
export interface AiUsageRecordDetail extends AiUsageRecordSummary {
  detail: unknown | null
}

/**
 * AI 建议变更模块
 */
export type AiResumeOptimizationChangedModule =
  | 'profile'
  | 'experiences'
  | 'projects'
  | 'highlights'

/**
 * 资料补丁
 */
export interface AiResumeOptimizationProfilePatch {
  headline?: LocalizedText
  summary?: LocalizedText
}

/**
 * 工作经历补丁
 */
export interface AiResumeOptimizationExperiencePatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

/**
 * 项目补丁
 */
export interface AiResumeOptimizationProjectPatch {
  index: number
  summary?: LocalizedText
  highlights?: LocalizedText[]
}

/**
 * 总补丁
 */
export interface AiResumeOptimizationPatch {
  profile?: AiResumeOptimizationProfilePatch
  experiences?: AiResumeOptimizationExperiencePatch[]
  projects?: AiResumeOptimizationProjectPatch[]
  highlights?: ResumeHighlightItem[]
}

/**
 * 字段差异条目
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
 * 模块差异
 */
export interface AiResumeOptimizationModuleDiff {
  module: AiResumeOptimizationChangedModule
  title: string
  reason: string
  entries: AiResumeOptimizationDiffEntry[]
}

/**
 * 应用建议参数
 */
export interface ApplyAiResumeOptimizationInput {
  apiBaseUrl: string
  accessToken: string
  resultId: string
  modules: AiResumeOptimizationChangedModule[]
}

/**
 * 建议结果摘要/详情
 */
export interface AiResumeOptimizationResultDetail {
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

export type AiResumeOptimizationResult = AiResumeOptimizationResultDetail

/**
 * 获取优化结果请求参数。
 */
export interface FetchAiResumeOptimizationResultInput extends RuntimeInput {
  locale: AiWorkbenchLocale
  resultId: string
}

/**
 * 获取 AI 使用历史请求参数。
 */
export interface FetchAiUsageHistoryInput extends RuntimeInput {
  limit?: number
  type?: AiUsageRecordFilterType
}

/**
 * 获取 AI 使用记录详情请求参数。
 */
export interface FetchAiUsageRecordDetailInput extends RuntimeInput {
  recordId: string
}

/**
 * 应用建议结果
 */
export type ApplyAiResumeOptimizationResult = ResumeDraftSnapshot

/**
 * 文件类型
 */
export type ExtractedFileType = 'txt' | 'md' | 'pdf' | 'docx'

/**
 * 文件提取结果
 */
export interface FileExtractionResult {
  fileName: string
  fileType: ExtractedFileType
  mimeType: string
  text: string
  charCount: number
}

/**
 * 运行时查询参数
 */
export interface RuntimeInput {
  apiBaseUrl: string
  accessToken: string
}

/**
 * 分析参数
 */
export interface AnalysisInput extends RuntimeInput {
  scenario: AiWorkbenchScenario
  content: string
  locale: AiWorkbenchLocale
}

/**
 * 简历优化参数
 */
export interface ResumeOptimizationInput extends RuntimeInput {
  instruction: string
  locale: AiWorkbenchLocale
  requestInit?: ApiRequestInput['requestInit']
}

/**
 * 文件提取参数
 */
export interface ExtractTextFromFileInput {
  apiBaseUrl: string
  accessToken: string
  file: File
}

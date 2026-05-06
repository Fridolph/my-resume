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
 * AI 使用记录场景。
 *
 * `resume-import` 不是通用分析报告场景，只用于历史记录筛选与展示。
 */
export type AiUsageRecordScenario = AiWorkbenchScenario | 'resume-import'

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
export type AiUsageRecordOperationType =
  | 'analysis-report'
  | 'resume-optimization'
  | 'resume-import'

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
  scenario: AiUsageRecordScenario
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
 * AI 简历导入可回填模块。
 */
export type AiResumeImportModule =
  | 'profile'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'

/**
 * AI 简历导入模块 diff 状态。
 */
export type AiResumeImportDiffStatus = 'added' | 'changed' | 'unchanged' | 'warning'

/**
 * AI 简历导入模块差异条目。
 */
export interface AiResumeImportDiffEntry {
  /** 条目稳定键，当前 MVP 使用模块名，后续可扩展为字段路径。 */
  key: string
  /** 面向用户展示的条目名称。 */
  label: string
  /** 当前 draft 中该条目的摘要值，不承载完整结构化 JSON。 */
  currentValue: string
  /** AI 候选草稿中该条目的摘要值，用于结果看台对照。 */
  suggestedValue: string
  /** 该条目在模块 diff 中的展示状态。 */
  status: AiResumeImportDiffStatus
  /** 与该条目相关的质量提醒；存在时需要用户回填前重点确认。 */
  warning?: string
}

/**
 * AI 简历导入模块差异。
 */
export interface AiResumeImportModuleDiff {
  /** 当前 diff 对应的简历模块。 */
  module: AiResumeImportModule
  /** 模块展示标题。 */
  title: string
  /** 模块整体差异状态，用于结果页标签和按钮状态。 */
  status: AiResumeImportDiffStatus
  /** 面向用户解释该模块为什么可回填或无需回填。 */
  reason: string
  /** 模块下的摘要级对照条目；第一版不做字段级逐项勾选。 */
  entries: AiResumeImportDiffEntry[]
}

/**
 * AI 简历导入模块统计。
 */
export interface AiResumeImportModuleStats {
  /** AI 候选草稿中识别到的教育经历数量。 */
  education: number
  /** AI 候选草稿中识别到的工作经历数量。 */
  experiences: number
  /** AI 候选草稿中识别到的项目经历数量。 */
  projects: number
  /** AI 候选草稿中识别到的技能分组数量。 */
  skills: number
  /** AI 候选草稿中识别到的亮点数量。 */
  highlights: number
}

/**
 * 简历导入结果页中一个可读内容条目。
 */
export interface AiResumeImportModuleContentItem {
  /** 条目稳定键，用于前端列表渲染。 */
  key: string
  /** 条目主标题，例如项目名、公司名或技能分组名。 */
  title: string
  /** 条目副标题，例如角色、学历或时间范围。 */
  subtitle?: string
  /** 条目元信息，例如地点、技术栈、联系方式。 */
  meta: string[]
  /** 条目正文行，保留摘要、亮点、关键词等用户确认所需内容。 */
  body: string[]
}

/**
 * 简历导入结果页中一个模块的完整可读内容。
 */
export interface AiResumeImportModuleContent {
  /** 当前内容所属模块。 */
  module: AiResumeImportModule
  /** 模块展示标题。 */
  title: string
  /** 当前 draft 中该模块的可读条目。 */
  currentItems: AiResumeImportModuleContentItem[]
  /** AI 候选草稿中该模块的可读条目。 */
  candidateItems: AiResumeImportModuleContentItem[]
  /** 只和当前模块相关的质量提醒。 */
  warnings: string[]
}

/**
 * 输入治理阶段丢弃的一条内容摘要。
 */
export interface AiResumeImportDiscardedItem {
  /** 被丢弃片段的短摘要，不展示完整风险原文。 */
  summary: string
  /** 丢弃原因，例如提示词注入、广告推广或异常链接。 */
  reason: string
  /** 风险归类，便于结果页展示和后续统计。 */
  riskType: 'prompt_injection' | 'advertisement' | 'unsafe_markup' | 'irrelevant'
}

/**
 * 用户上传源文档的审计摘要。
 */
export interface AiResumeImportSourceSnapshot {
  /** 上传文件名。 */
  fileName: string
  /** 上传文件字节大小。 */
  fileSize: number
  /** 文件提取后的原文字符数。 */
  rawCharCount: number
  /** 格式归一后的中间稿字符数。 */
  formattedCharCount: number
  /** 原文 sha256 摘要，用于审计与重复排查。 */
  sourceHash: string
}

/**
 * 简历导入 format / safety 阶段的展示报告。
 */
export interface AiResumeImportFormatReport {
  /** 格式归一阶段的用户可读摘要。 */
  summary: string
  /** 原文字符数。 */
  rawCharCount: number
  /** 格式归一后的字符数。 */
  formattedCharCount: number
  /** 格式归一后保留的有效行数。 */
  keptLineCount: number
  /** 被规则层丢弃的行数。 */
  discardedLineCount: number
  /** 被丢弃内容的展示级摘要。 */
  discardedItems: AiResumeImportDiscardedItem[]
  /** 输入治理识别到的风险类型。 */
  safetyFlags: string[]
  /** 格式归一或过滤阶段产生的提醒。 */
  warnings: string[]
}

/**
 * AI 简历导入识别结果。
 */
export interface AiResumeImportResult {
  /** 临时识别结果 ID，用于结果页读取和 apply。 */
  resultId: string
  /** 本次识别语言，第一版固定中文链路。 */
  locale: AiWorkbenchLocale
  /** 上传文件名，用于结果页展示和用户核对。 */
  fileName: string
  /** 上传文件类型，第一版仅支持 txt/md。 */
  fileType: 'txt' | 'md'
  /** 文件提取后的纯文本字符数，用于判断输入是否过短或过长。 */
  charCount: number
  /** AI 或 mock parser 生成的识别摘要。 */
  summary: string
  /** 不阻断回填但需要用户确认的质量提醒。 */
  warnings: string[]
  /** 与当前 draft 存在差异的模块集合。 */
  changedModules: AiResumeImportModule[]
  /** 当前 draft 与候选草稿的模块级 diff。 */
  moduleDiffs: AiResumeImportModuleDiff[]
  /** 当前 draft 与候选草稿的完整可读模块内容。 */
  moduleContents: AiResumeImportModuleContent[]
  /** 候选草稿的模块数量统计，用于结果看台快速判断识别质量。 */
  moduleStats: AiResumeImportModuleStats
  /** 上传源文档的审计摘要。 */
  sourceSnapshot?: AiResumeImportSourceSnapshot
  /** 输入格式归一与安全过滤报告。 */
  formatReport?: AiResumeImportFormatReport
  /** 识别结果创建时间。 */
  createdAt: string
  /** 当前 resultId 是否还允许回填；成功 apply 一次后会变为 false。 */
  canApply: boolean
  /** 已通过该 resultId 写回过的模块。 */
  appliedModules: AiResumeImportModule[]
  /** 该 resultId 成功写回草稿的时间。 */
  appliedAt?: string
  /** 本次识别使用的 provider 摘要，方便定位 mock/真实模型差异。 */
  providerSummary: {
    /** Provider 名称，如 mock / deepseek。 */
    provider: string
    /** 实际使用的模型名。 */
    model: string
    /** Provider 运行模式，如 mock / openai-compatible。 */
    mode: string
  }
}

/**
 * 简历导入异步任务阶段。
 */
export type AiResumeImportJobStage =
  | 'accepted'
  | 'extracting'
  | 'text_validating'
  | 'raw_archiving'
  | 'format_normalizing'
  | 'safety_filtering'
  | 'ai_generating'
  | 'json_parsing'
  | 'schema_validating'
  | 'diff_building'
  | 'completed'
  | 'failed'

/**
 * 简历导入异步任务整体状态。
 */
export type AiResumeImportJobStatus = 'running' | 'completed' | 'failed'

/**
 * 简历导入 SSE 事件类型。
 */
export type AiResumeImportJobStreamEvent =
  | 'job.snapshot'
  | 'job.completed'
  | 'job.failed'
  | 'job.heartbeat'
  | 'job.progress_hint'

/**
 * 简历导入异步任务单个阶段状态。
 */
export type AiResumeImportJobStepStatus = 'pending' | 'running' | 'completed' | 'failed'

/**
 * 简历导入异步任务时间线中的一个阶段。
 */
export interface AiResumeImportJobStep {
  /** 阶段标识。 */
  stage: AiResumeImportJobStage
  /** 面向用户展示的阶段名称。 */
  label: string
  /** 当前阶段状态。 */
  status: AiResumeImportJobStepStatus
  /** 阶段开始时间。 */
  startedAt?: string
  /** 阶段结束时间。 */
  completedAt?: string
  /** 阶段失败时的用户可读错误。 */
  message?: string
  /** 阶段完成或运行中的摘要，避免前端轮询时仍是黑盒。 */
  summary?: string
  /** 阶段诊断详情，通常只展示前几条关键提示。 */
  details?: string[]
}

/**
 * 简历导入异步任务详情。
 */
export interface AiResumeImportJob {
  /** 异步任务 ID，用于轮询任务状态。 */
  jobId: string
  /** 任务整体状态。 */
  status: AiResumeImportJobStatus
  /** 当前正在执行或最终落定的阶段。 */
  currentStage: AiResumeImportJobStage
  /** 阶段时间线。 */
  steps: AiResumeImportJobStep[]
  /** 任务创建时间。 */
  createdAt: string
  /** 任务最近更新时间。 */
  updatedAt: string
  /** 任务耗时毫秒；完成/失败后由服务端冻结。 */
  elapsedMs: number
  /** 任务完成后生成的结果 ID。 */
  resultId?: string
  /** 任务失败时的错误详情。 */
  error?: {
    /** 用户可读错误信息。 */
    message: string
    /** 请求链路 traceId，用于服务端日志定位。 */
    traceId?: string
  }
}

/**
 * 简历导入 SSE 心跳事件。
 */
export interface AiResumeImportJobHeartbeat {
  /** 当前订阅的 jobId。 */
  jobId: string
  /** 服务端发送心跳的时间。 */
  timestamp: string
}

/**
 * 简历导入 SSE 感知进度提示。
 */
export interface AiResumeImportJobProgressHint {
  /** 当前订阅的 jobId。 */
  jobId: string
  /** 面向用户展示的运行中提示。 */
  message: string
  /** 服务端发送提示的时间。 */
  timestamp: string
}

/**
 * 上传简历并识别为候选草稿参数。
 */
export interface RecognizeAiResumeImportInput extends RuntimeInput {
  /** 用户上传的 md/txt 文件。 */
  file: File
  /** 透传给 fetch 的请求配置，主要用于测试或少量调用定制。 */
  requestInit?: ApiRequestInput['requestInit']
}

/**
 * 获取简历导入识别结果参数。
 */
export interface FetchAiResumeImportResultInput extends RuntimeInput {
  /** recognize job completed 后返回的临时结果 ID。 */
  resultId: string
}

/**
 * 获取简历导入识别任务参数。
 */
export interface FetchAiResumeImportJobInput extends RuntimeInput {
  /** recognize 接口返回的异步任务 ID。 */
  jobId: string
}

/**
 * 订阅简历导入识别任务事件参数。
 */
export interface StreamAiResumeImportJobInput extends RuntimeInput {
  /** recognize 接口返回的异步任务 ID。 */
  jobId: string
  /** 取消 SSE 读取的 AbortSignal。 */
  signal?: AbortSignal
}

/**
 * 订阅简历导入识别任务事件回调。
 */
export interface StreamAiResumeImportJobHandlers {
  /** 收到普通快照事件时触发。 */
  onSnapshot?: (job: AiResumeImportJob) => void
  /** 收到 completed 事件时触发。 */
  onCompleted?: (job: AiResumeImportJob) => void
  /** 收到 failed 事件时触发。 */
  onFailed?: (job: AiResumeImportJob) => void
  /** 收到 heartbeat 事件时触发。 */
  onHeartbeat?: (heartbeat: AiResumeImportJobHeartbeat) => void
  /** 收到长耗时阶段感知进度提示时触发。 */
  onProgressHint?: (hint: AiResumeImportJobProgressHint) => void
}

/**
 * 应用简历导入结果参数。
 */
export interface ApplyAiResumeImportInput extends RuntimeInput {
  /** 要写回草稿的临时识别结果 ID。 */
  resultId: string
  /** 用户确认要一次性写回 draft 的模块列表。 */
  modules: AiResumeImportModule[]
}

/**
 * 应用简历导入结果后的返回快照。
 */
export type ApplyAiResumeImportResult = ResumeDraftSnapshot

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
 * 删除 AI 使用记录请求参数。
 */
export interface DeleteAiUsageRecordInput extends RuntimeInput {
  recordId: string
}

/**
 * 删除 AI 使用记录响应。
 */
export interface DeleteAiUsageRecordResult {
  deleted: true
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

/**
 * RAG user_docs 入库作用域。
 */
export type RagUserDocIngestScope = 'draft' | 'published'

/**
 * RAG user_docs 切片策略。
 *
 * `balanced` 用于默认教学闭环，`contextual` 用于保留更长上下文的检索实验。
 */
export type RagUserDocChunkingProfile = 'balanced' | 'contextual'

/**
 * RAG user_docs 入库参数。
 */
export interface IngestRagUserDocInput {
  /** API 服务根地址。 */
  apiBaseUrl: string
  /** 当前管理员访问令牌。 */
  accessToken: string
  /** 需要提取并写入 user_docs 检索态的文件。 */
  file: File
  /** 入库作用域，默认由服务端按 draft 处理。 */
  scope?: RagUserDocIngestScope
  /** 切片策略，未传时服务端使用 balanced。 */
  chunkingProfile?: RagUserDocChunkingProfile
  /** 自定义切片大小，范围 4-6666，优先级高于 profile 默认值。 */
  chunkSize?: number
  /** 自定义重叠字符数，范围 0-300，且必须小于 chunkSize。 */
  chunkOverlap?: number
}

/**
 * RAG user_docs 入库结果。
 */
export interface RagUserDocIngestResult {
  /** 检索态文档 ID，可用于追溯整份上传资料。 */
  documentId: string
  /** 来源 ID，同一文件版本的 chunks 会共享该来源键。 */
  sourceId: string
  /** 写入的资料作用域。 */
  sourceScope: RagUserDocIngestScope
  /** 上传版本键，用于区分同一资料的不同入库版本。 */
  sourceVersion: string
  /** 本次入库生成的 chunk 数量。 */
  chunkCount: number
  /** 上传文件名。 */
  fileName: string
  /** 解析后的文件类型。 */
  fileType: ExtractedFileType
  /** 实际使用的切片策略。 */
  chunkingProfile: RagUserDocChunkingProfile
  /** 实际切片大小，单位为字符。 */
  chunkSize: number
  /** 相邻 chunk 的重叠字符数。 */
  chunkOverlap: number
  /** 文件上传并入库完成的时间。 */
  uploadedAt: string
}

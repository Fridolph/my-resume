import type {
  ResumeLocale,
  StandardResume,
} from '../../../../resume/domain/standard-resume'

/**
 * 简历导入第一版支持的模块粒度。
 *
 * MVP 只允许用户按模块批量确认回填，不做字段级逐项勾选。
 */
export type ResumeImportModule =
  | 'profile'
  | 'education'
  | 'experiences'
  | 'projects'
  | 'skills'
  | 'highlights'

/**
 * 模块级 diff 的展示状态。
 */
export type ResumeImportDiffStatus = 'added' | 'changed' | 'unchanged' | 'warning'

/**
 * 上传文件启动识别任务所需的原始文件信息。
 */
export interface RecognizeResumeImportInput {
  /** 上传文件的内存内容，由 Multer 提供。 */
  buffer: Buffer
  /** 当前请求 traceId，用于异步 Job 失败时回传定位信息。 */
  traceId?: string
  /** 用户上传的原始文件名，用于扩展名校验和结果展示。 */
  originalname: string
  /** 上传文件 MIME 类型，用于文本提取和阶段详情展示。 */
  mimetype: string
  /** 上传文件字节大小，用于 1MB 边界校验和 UI 摘要。 */
  size: number
}

/**
 * 将识别候选草稿回填到当前 draft 的请求。
 */
export interface ApplyResumeImportInput {
  /** 识别完成后生成的临时结果 ID。 */
  resultId: string
  /** 用户确认要一次性写回 draft 的模块列表。 */
  modules: ResumeImportModule[]
}

/**
 * 模块 diff 中的一条摘要级对比项。
 */
export interface ResumeImportModuleDiffEntry {
  /** 条目稳定键，当前 MVP 使用模块名。 */
  key: string
  /** 面向用户展示的条目名称。 */
  label: string
  /** 当前 draft 在该条目上的摘要值。 */
  currentValue: string
  /** AI 候选草稿在该条目上的摘要值。 */
  suggestedValue: string
  /** 该条目的差异状态。 */
  status: ResumeImportDiffStatus
  /** 与该条目相关的质量提醒，存在时需要用户重点确认。 */
  warning?: string
}

/**
 * 一个简历模块的摘要级 diff。
 */
export interface ResumeImportModuleDiff {
  /** 当前 diff 对应的简历模块。 */
  module: ResumeImportModule
  /** 模块展示标题。 */
  title: string
  /** 模块整体差异状态。 */
  status: ResumeImportDiffStatus
  /** 面向用户解释该模块为什么可回填或无需回填。 */
  reason: string
  /** 当前 MVP 的摘要级 diff 条目。 */
  entries: ResumeImportModuleDiffEntry[]
}

/**
 * 候选草稿中各列表模块的识别数量，用于结果看台快速判断识别质量。
 */
export interface ResumeImportModuleStats {
  /** 识别到的教育经历数量。 */
  education: number
  /** 识别到的工作经历数量。 */
  experiences: number
  /** 识别到的项目经历数量。 */
  projects: number
  /** 识别到的技能分组数量。 */
  skills: number
  /** 识别到的亮点数量。 */
  highlights: number
}

/**
 * 结果看台中一个可读内容条目。
 */
export interface ResumeImportModuleContentItem {
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
 * 结果看台中一个模块的完整可读内容。
 */
export interface ResumeImportModuleContent {
  /** 当前内容所属模块。 */
  module: ResumeImportModule
  /** 模块展示标题。 */
  title: string
  /** 当前 draft 中该模块的可读条目。 */
  currentItems: ResumeImportModuleContentItem[]
  /** AI 候选草稿中该模块的可读条目。 */
  candidateItems: ResumeImportModuleContentItem[]
  /** 只和当前模块相关的质量提醒。 */
  warnings: string[]
}

/**
 * 输入治理阶段丢弃的一条内容摘要。
 *
 * 前端只展示摘要和原因，不展示完整风险原文，避免二次传播。
 */
export interface ResumeImportDiscardedItem {
  /** 被丢弃片段的短摘要。 */
  summary: string
  /** 丢弃原因，例如提示词注入、广告推广或异常链接。 */
  reason: string
  /** 风险归类，便于后续统计和筛选。 */
  riskType: 'prompt_injection' | 'advertisement' | 'unsafe_markup' | 'irrelevant'
}

/**
 * 用户上传源文档的审计摘要。
 */
export interface ResumeImportSourceSnapshot {
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
export interface ResumeImportFormatReport {
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
  discardedItems: ResumeImportDiscardedItem[]
  /** 输入治理识别到的风险类型。 */
  safetyFlags: string[]
  /** 格式归一或过滤阶段产生的提醒。 */
  warnings: string[]
}

/**
 * 简历导入识别完成后的临时结果详情。
 *
 * 该结果存储在内存缓存中，服务重启后会失效。MVP 中同一个 resultId 只允许成功回填一次。
 */
export interface ResumeImportResultDetail {
  /** 临时识别结果 ID，用于结果页读取和 apply。 */
  resultId: string
  /** 本次识别语言，第一版固定为中文。 */
  locale: ResumeLocale
  /** 上传文件名，用于结果看台展示。 */
  fileName: string
  /** 上传文件类型，第一版仅支持 txt/md。 */
  fileType: 'txt' | 'md'
  /** 提取后的纯文本字符数。 */
  charCount: number
  /** AI 或 mock parser 给出的识别摘要。 */
  summary: string
  /** 允许继续回填但需要用户确认的质量提醒。 */
  warnings: string[]
  /** 与当前 draft 存在差异的模块。 */
  changedModules: ResumeImportModule[]
  /** 当前 draft 与候选草稿的模块级 diff。 */
  moduleDiffs: ResumeImportModuleDiff[]
  /** 当前 draft 与候选草稿的完整可读模块内容。 */
  moduleContents: ResumeImportModuleContent[]
  /** 候选草稿各模块识别数量统计。 */
  moduleStats: ResumeImportModuleStats
  /** 上传源文档的审计摘要。 */
  sourceSnapshot?: ResumeImportSourceSnapshot
  /** 输入格式归一与安全过滤报告。 */
  formatReport?: ResumeImportFormatReport
  /** 识别结果创建时间。 */
  createdAt: string
  /** 当前 resultId 是否还允许回填。成功 apply 一次后会变为 false。 */
  canApply: boolean
  /** 已通过该 resultId 写回过的模块。 */
  appliedModules: ResumeImportModule[]
  /** 该 resultId 成功写回草稿的时间。 */
  appliedAt?: string
  /** 本次识别使用的 AI provider 摘要。 */
  providerSummary: {
    /** Provider 名称，如 mock / deepseek。 */
    provider: string
    /** 实际模型名。 */
    model: string
    /** Provider 运行模式，如 mock / openai-compatible。 */
    mode: string
  }
}

/**
 * 异步识别任务阶段。
 */
export type ResumeImportJobStage =
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
 * 异步识别任务整体状态。
 */
export type ResumeImportJobStatus = 'running' | 'completed' | 'failed'

/**
 * SSE 推送给前端的简历导入 Job 事件类型。
 */
export type ResumeImportJobStreamEvent =
  | 'job.snapshot'
  | 'job.completed'
  | 'job.failed'
  | 'job.heartbeat'
  | 'job.progress_hint'

/**
 * 单个任务阶段的状态。
 */
export type ResumeImportJobStepStatus = 'pending' | 'running' | 'completed' | 'failed'

/**
 * 异步识别任务时间线中的一个阶段。
 */
export interface ResumeImportJobStep {
  /** 阶段标识。 */
  stage: ResumeImportJobStage
  /** 面向用户展示的阶段名称。 */
  label: string
  /** 阶段当前状态。 */
  status: ResumeImportJobStepStatus
  /** 阶段开始时间。 */
  startedAt?: string
  /** 阶段结束时间。 */
  completedAt?: string
  /** 阶段失败时的用户可读错误。 */
  message?: string
  /** 阶段完成或运行中的摘要。 */
  summary?: string
  /** 阶段诊断详情，避免前端成为黑盒。 */
  details?: string[]
}

/**
 * 异步识别任务失败详情。
 */
export interface ResumeImportJobError {
  /** 用户可读错误信息。 */
  message: string
  /** 请求链路 traceId，用于服务端日志定位。 */
  traceId?: string
}

/**
 * SSE 运行态感知进度提示。
 *
 * 该事件不代表真实阶段推进，只用于长时间 AI 生成期间降低黑盒等待感。
 */
export interface ResumeImportJobProgressHint {
  /** 当前订阅的 jobId。 */
  jobId: string
  /** 面向用户展示的进度提示。 */
  message: string
  /** 服务端发送提示的时间。 */
  timestamp: string
}

/**
 * 异步识别任务详情。
 */
export interface ResumeImportJobDetail {
  /** 识别任务 ID。 */
  jobId: string
  /** 任务整体状态。 */
  status: ResumeImportJobStatus
  /** 当前正在执行或最终落定的阶段。 */
  currentStage: ResumeImportJobStage
  /** 阶段时间线。 */
  steps: ResumeImportJobStep[]
  /** 任务创建时间。 */
  createdAt: string
  /** 任务最近更新时间。 */
  updatedAt: string
  /** 任务耗时毫秒；完成/失败后会冻结。 */
  elapsedMs: number
  /** 任务完成后生成的 resultId。 */
  resultId?: string
  /** 任务失败时的错误详情。 */
  error?: ResumeImportJobError
}

/**
 * 内存缓存中的识别结果。
 */
export interface CachedResumeImportResult {
  /** 修复、归一化、校验后的候选草稿。 */
  candidateResume: StandardResume
  /** 结果创建时间，用于 TTL 清理。 */
  createdAt: string
  /** 返回给 API 的结果详情。 */
  detail: ResumeImportResultDetail
  /** 识别发生时 draft 的更新时间，用于 apply 冲突校验。 */
  draftUpdatedAt: string
  /** 持久化到 ai_usage_records 后的审计记录 ID。 */
  usageRecordId?: string
  /** 用户上传简历提取后的完整原文，仅保存在服务端审计快照中。 */
  rawText?: string
  /** 经过格式归一与安全过滤后的中间稿。 */
  formattedText?: string
  /** 原文摘要，用于审计与重复排查。 */
  sourceHash?: string
}

/**
 * 内存缓存中的异步任务。
 */
export interface CachedResumeImportJob {
  /** 任务创建时间，用于 TTL 清理。 */
  createdAt: string
  /** 任务详情；elapsedMs 在读取时动态计算。 */
  detail: Omit<ResumeImportJobDetail, 'elapsedMs'>
}

/**
 * AI provider 返回的原始识别载荷。
 */
export interface ProviderResumeImportPayload {
  /** AI 生成的候选简历，进入业务前必须 repair + normalize + validate。 */
  resume: unknown
  /** AI 给出的识别摘要。 */
  summary?: string
  /** AI 给出的质量提醒。 */
  warnings?: string[]
  /** AI 在同一次识别调用中补充的输入治理报告，会与本地规则层报告合并。 */
  formatReport?: Partial<ResumeImportFormatReport>
}

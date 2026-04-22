import { defaultApiClient as Alova } from './client'
import type {
  AiResumeOptimizationResultDetail,
  AiResumeOptimizationResult,
  AiUsageRecordDetail,
  AiUsageRecordSummary,
  AiWorkbenchCachedReportSummary,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
  AnalysisInput,
  ApplyAiResumeOptimizationInput,
  ApplyAiResumeOptimizationResult,
  ExtractTextFromFileInput,
  FetchAiResumeOptimizationResultInput,
  FetchAiUsageHistoryInput,
  FetchAiUsageRecordDetailInput,
  FileExtractionResult,
  IngestRagUserDocInput,
  RagUserDocIngestResult,
  ResumeOptimizationInput,
  RuntimeInput,
  TriggerAiWorkbenchAnalysisResult,
} from './types/ai.types'

export type {
  AiAnalysisSuggestionModule,
  AiResumeOptimizationChangedModule,
  AiResumeOptimizationDiffEntry,
  AiResumeOptimizationExperiencePatch,
  AiResumeOptimizationModuleDiff,
  AiResumeOptimizationPatch,
  AiResumeOptimizationProfilePatch,
  AiResumeOptimizationProjectPatch,
  AiResumeOptimizationResultDetail,
  AiResumeOptimizationResult,
  AiUsageRecordDetail,
  AiUsageRecordFilterType,
  AiUsageRecordOperationType,
  AiUsageRecordStatus,
  AiUsageRecordSummary,
  AiWorkbenchCachedReportSummary,
  AiWorkbenchLocale,
  AiWorkbenchReport,
  AiWorkbenchReportGenerator,
  AiWorkbenchReportSection,
  AiWorkbenchRuntimeSummary,
  AiWorkbenchScenario,
  AiWorkbenchScore,
  AiWorkbenchSuggestion,
  AnalysisInput,
  ApplyAiResumeOptimizationInput,
  ApplyAiResumeOptimizationResult,
  ExtractedFileType,
  ExtractTextFromFileInput,
  FetchAiResumeOptimizationResultInput,
  FetchAiUsageHistoryInput,
  FetchAiUsageRecordDetailInput,
  FileExtractionResult,
  IngestRagUserDocInput,
  RagUserDocIngestResult,
  RagUserDocIngestScope,
  ResumeOptimizationInput,
  RuntimeInput,
  TriggerAiWorkbenchAnalysisResult,
} from './types/ai.types'

/**
 * 构造读取 AI 运行时摘要 Method
 *
 * @param input 请求参数
 * @returns 运行时摘要请求 Method
 */
export function createFetchAiWorkbenchRuntimeMethod(input: RuntimeInput) {
  return Alova.createMethod<AiWorkbenchRuntimeSummary>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/reports/runtime',
    accessToken: input.accessToken,
    fallbackErrorMessage: 'AI 工作台运行时信息加载失败',
  })
}

export function createFetchAiUsageHistoryMethod(input: FetchAiUsageHistoryInput) {
  return Alova.createMethod<AiUsageRecordSummary[]>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/reports/history',
    accessToken: input.accessToken,
    query: {
      limit: input.limit,
      type: input.type,
    },
    fallbackErrorMessage: 'AI 调用记录加载失败',
    transform: (payload) =>
      ((payload as { records?: AiUsageRecordSummary[] }).records ?? []) as AiUsageRecordSummary[],
  })
}

export function createFetchAiUsageRecordDetailMethod(input: FetchAiUsageRecordDetailInput) {
  return Alova.createMethod<AiUsageRecordDetail>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: `/ai/reports/history/${input.recordId}`,
    accessToken: input.accessToken,
    fallbackErrorMessage: 'AI 调用记录详情加载失败',
  })
}

/**
 * 构造触发 AI 分析 Method
 *
 * @param input 请求参数
 * @returns 分析请求 Method
 */
export function createTriggerAiWorkbenchAnalysisMethod(input: AnalysisInput) {
  return Alova.createMethod<TriggerAiWorkbenchAnalysisResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/reports/analyze',
    method: 'POST',
    accessToken: input.accessToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      scenario: input.scenario,
      content: input.content,
      locale: input.locale,
    }),
    fallbackErrorMessage: '真实分析触发失败，请稍后重试',
  })
}

/**
 * 构造生成结构化建议 Method
 *
 * @param input 请求参数
 * @returns 建议生成请求 Method
 */
export function createGenerateAiResumeOptimizationMethod(input: ResumeOptimizationInput) {
  return Alova.createMethod<AiResumeOptimizationResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/reports/resume-optimize',
    method: 'POST',
    accessToken: input.accessToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instruction: input.instruction,
      locale: input.locale,
    }),
    requestInit: input.requestInit,
    fallbackErrorMessage: '结构化简历建议生成失败，请稍后重试',
  })
}

/**
 * 构造读取结构化建议结果 Method
 *
 * @param input 请求参数
 * @returns 结果详情请求 Method
 */
export function createFetchAiResumeOptimizationResultMethod(
  input: FetchAiResumeOptimizationResultInput,
) {
  return Alova.createMethod<AiResumeOptimizationResultDetail>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: `/ai/reports/resume-optimize/results/${input.resultId}`,
    accessToken: input.accessToken,
    query: {
      locale: input.locale,
    },
    fallbackErrorMessage: '结构化简历建议结果加载失败，请稍后重试',
  })
}

/**
 * 构造应用结构化建议 Method
 *
 * @param input 请求参数
 * @returns 应用建议请求 Method
 */
export function createApplyAiResumeOptimizationMethod(input: ApplyAiResumeOptimizationInput) {
  return Alova.createMethod<ApplyAiResumeOptimizationResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/reports/resume-optimize/apply',
    method: 'POST',
    accessToken: input.accessToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resultId: input.resultId,
      modules: input.modules,
    }),
    fallbackErrorMessage: 'AI 建议稿应用失败，请稍后重试',
  })
}

/**
 * 构造读取缓存报告列表 Method
 *
 * @param input 请求参数
 * @returns 缓存列表请求 Method
 */
export function createFetchCachedAiWorkbenchReportsMethod(input: RuntimeInput) {
  return Alova.createMethod<AiWorkbenchCachedReportSummary[]>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/reports/cache',
    accessToken: input.accessToken,
    fallbackErrorMessage: '缓存报告列表加载失败',
    transform: (payload) =>
      ((payload as { reports?: AiWorkbenchCachedReportSummary[] }).reports ?? []) as
        AiWorkbenchCachedReportSummary[],
  })
}

/**
 * 构造读取单个缓存报告 Method
 *
 * @param input 请求参数
 * @returns 缓存详情请求 Method
 */
export function createFetchCachedAiWorkbenchReportMethod(
  input: RuntimeInput & {
    reportId: string
  },
) {
  return Alova.createMethod<AiWorkbenchReport>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: `/ai/reports/cache/${input.reportId}`,
    accessToken: input.accessToken,
    fallbackErrorMessage: '缓存报告详情加载失败',
  })
}

/**
 * 构造上传文件提取文本 Method
 *
 * @param input 请求参数
 * @returns 文件提取请求 Method
 */
export function createExtractTextFromFileMethod(input: ExtractTextFromFileInput) {
  const formData = new FormData()
  formData.append('file', input.file)

  return Alova.createMethod<FileExtractionResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/extract-text',
    method: 'POST',
    accessToken: input.accessToken,
    body: formData,
    fallbackErrorMessage: '文件提取失败，请稍后重试',
  })
}

/**
 * 构造上传 user_docs 入库 Method
 *
 * @param input 请求参数
 * @returns user_docs 入库请求 Method
 */
export function createIngestRagUserDocMethod(input: IngestRagUserDocInput) {
  const formData = new FormData()
  formData.append('file', input.file)

  if (input.scope) {
    formData.append('scope', input.scope)
  }

  return Alova.createMethod<RagUserDocIngestResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/rag/ingest/user-doc',
    method: 'POST',
    accessToken: input.accessToken,
    body: formData,
    fallbackErrorMessage: 'user_docs 入库失败，请稍后重试',
  })
}

import { defaultApiClient as Alova } from './client'
import type {
  AiResumeOptimizationResult,
  AiWorkbenchCachedReportSummary,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
  AnalysisInput,
  ApplyAiResumeOptimizationInput,
  ApplyAiResumeOptimizationResult,
  ExtractTextFromFileInput,
  FileExtractionResult,
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
  AiResumeOptimizationResult,
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
  FileExtractionResult,
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
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取 AI 工作台运行时摘要
 *
 * @param input 请求参数
 * @returns 运行时摘要
 */
export async function fetchAiWorkbenchRuntime(
  input: RuntimeInput,
): Promise<AiWorkbenchRuntimeSummary> {
  return Alova.send(createFetchAiWorkbenchRuntimeMethod(input), {
    method: 'GET',
    fallbackErrorMessage: 'AI 工作台运行时信息加载失败',
    requestPolicy: input.requestPolicy,
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
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 触发 AI 分析
 *
 * @param input 请求参数
 * @returns 分析结果
 */
export async function triggerAiWorkbenchAnalysis(
  input: AnalysisInput,
): Promise<TriggerAiWorkbenchAnalysisResult> {
  return Alova.send(createTriggerAiWorkbenchAnalysisMethod(input), {
    method: 'POST',
    fallbackErrorMessage: '真实分析触发失败，请稍后重试',
    requestPolicy: input.requestPolicy,
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
    fallbackErrorMessage: '结构化简历建议生成失败，请稍后重试',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 生成结构化简历优化建议
 *
 * @param input 请求参数
 * @returns 优化建议结果
 */
export async function generateAiResumeOptimization(
  input: ResumeOptimizationInput,
): Promise<AiResumeOptimizationResult> {
  return Alova.send(createGenerateAiResumeOptimizationMethod(input), {
    method: 'POST',
    fallbackErrorMessage: '结构化简历建议生成失败，请稍后重试',
    requestPolicy: input.requestPolicy,
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
      draftUpdatedAt: input.draftUpdatedAt,
      modules: input.modules,
      patch: input.patch,
    }),
    fallbackErrorMessage: 'AI 建议稿应用失败，请稍后重试',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 应用结构化简历优化建议
 *
 * @param input 请求参数
 * @returns 应用后的草稿快照
 */
export async function applyAiResumeOptimization(
  input: ApplyAiResumeOptimizationInput,
): Promise<ApplyAiResumeOptimizationResult> {
  return Alova.send(createApplyAiResumeOptimizationMethod(input), {
    method: 'POST',
    fallbackErrorMessage: 'AI 建议稿应用失败，请稍后重试',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 构造读取缓存报告列表 Method
 *
 * @param input 请求参数
 * @returns 缓存列表请求 Method
 */
export function createFetchCachedAiWorkbenchReportsMethod(input: RuntimeInput) {
  return Alova.createMethod<{
    reports: AiWorkbenchCachedReportSummary[]
  }>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/reports/cache',
    accessToken: input.accessToken,
    fallbackErrorMessage: '缓存报告列表加载失败',
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取缓存报告列表
 *
 * @param input 请求参数
 * @returns 报告摘要列表
 */
export async function fetchCachedAiWorkbenchReports(
  input: RuntimeInput,
): Promise<AiWorkbenchCachedReportSummary[]> {
  const payload = await Alova.send(createFetchCachedAiWorkbenchReportsMethod(input), {
    method: 'GET',
    fallbackErrorMessage: '缓存报告列表加载失败',
    requestPolicy: input.requestPolicy,
  })

  return payload.reports
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
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 读取单个缓存报告
 *
 * @param input 请求参数
 * @returns 报告详情
 */
export async function fetchCachedAiWorkbenchReport(
  input: RuntimeInput & {
    reportId: string
  },
): Promise<AiWorkbenchReport> {
  return Alova.send(createFetchCachedAiWorkbenchReportMethod(input), {
    method: 'GET',
    fallbackErrorMessage: '缓存报告详情加载失败',
    requestPolicy: input.requestPolicy,
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
    requestPolicy: input.requestPolicy,
  })
}

/**
 * 上传文件并提取文本
 *
 * @param input 请求参数
 * @returns 提取结果
 */
export async function extractTextFromFile(
  input: ExtractTextFromFileInput,
): Promise<FileExtractionResult> {
  return Alova.send(createExtractTextFromFileMethod(input), {
    method: 'POST',
    fallbackErrorMessage: '文件提取失败，请稍后重试',
    requestPolicy: input.requestPolicy,
  })
}

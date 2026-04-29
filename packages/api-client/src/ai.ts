import { defaultApiClient as Alova, joinApiUrl } from './client'
import type {
  AiResumeImportJobHeartbeat,
  AiResumeImportJobProgressHint,
  AiResumeOptimizationResultDetail,
  AiResumeOptimizationResult,
  AiUsageRecordDetail,
  AiUsageRecordSummary,
  AiResumeImportJob,
  AiResumeImportJobStreamEvent,
  AiResumeImportResult,
  AiWorkbenchCachedReportSummary,
  AiWorkbenchReport,
  AiWorkbenchRuntimeSummary,
  AnalysisInput,
  ApplyAiResumeImportInput,
  ApplyAiResumeImportResult,
  ApplyAiResumeOptimizationInput,
  ApplyAiResumeOptimizationResult,
  DeleteAiUsageRecordInput,
  DeleteAiUsageRecordResult,
  ExtractTextFromFileInput,
  FetchAiResumeImportJobInput,
  FetchAiResumeImportResultInput,
  FetchAiResumeOptimizationResultInput,
  FetchAiUsageHistoryInput,
  FetchAiUsageRecordDetailInput,
  FileExtractionResult,
  IngestRagUserDocInput,
  RagUserDocIngestResult,
  ResumeOptimizationInput,
  RecognizeAiResumeImportInput,
  RuntimeInput,
  StreamAiResumeImportJobHandlers,
  StreamAiResumeImportJobInput,
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
  AiResumeImportDiffEntry,
  AiResumeImportDiffStatus,
  AiResumeImportDiscardedItem,
  AiResumeImportFormatReport,
  AiResumeImportJob,
  AiResumeImportJobStage,
  AiResumeImportJobStatus,
  AiResumeImportJobStreamEvent,
  AiResumeImportJobProgressHint,
  AiResumeImportJobStep,
  AiResumeImportJobStepStatus,
  AiResumeImportModule,
  AiResumeImportModuleContent,
  AiResumeImportModuleContentItem,
  AiResumeImportModuleDiff,
  AiResumeImportModuleStats,
  AiResumeImportResult,
  AiResumeImportSourceSnapshot,
  AiUsageRecordDetail,
  AiUsageRecordFilterType,
  AiUsageRecordOperationType,
  AiUsageRecordScenario,
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
  ApplyAiResumeImportInput,
  ApplyAiResumeImportResult,
  ApplyAiResumeOptimizationInput,
  ApplyAiResumeOptimizationResult,
  DeleteAiUsageRecordInput,
  DeleteAiUsageRecordResult,
  ExtractedFileType,
  ExtractTextFromFileInput,
  FetchAiResumeImportJobInput,
  FetchAiResumeImportResultInput,
  FetchAiResumeOptimizationResultInput,
  FetchAiUsageHistoryInput,
  FetchAiUsageRecordDetailInput,
  FileExtractionResult,
  IngestRagUserDocInput,
  RagUserDocIngestResult,
  RagUserDocIngestScope,
  RecognizeAiResumeImportInput,
  ResumeOptimizationInput,
  RuntimeInput,
  StreamAiResumeImportJobHandlers,
  StreamAiResumeImportJobInput,
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
      ((payload as { records?: AiUsageRecordSummary[] }).records ??
        []) as AiUsageRecordSummary[],
  })
}

export function createFetchAiUsageRecordDetailMethod(
  input: FetchAiUsageRecordDetailInput,
) {
  return Alova.createMethod<AiUsageRecordDetail>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: `/ai/reports/history/${input.recordId}`,
    accessToken: input.accessToken,
    fallbackErrorMessage: 'AI 调用记录详情加载失败',
  })
}

export function createDeleteAiUsageRecordMethod(input: DeleteAiUsageRecordInput) {
  return Alova.createMethod<DeleteAiUsageRecordResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: `/ai/reports/history/${input.recordId}`,
    method: 'DELETE',
    accessToken: input.accessToken,
    fallbackErrorMessage: 'AI 调用记录删除失败，请稍后重试',
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
export function createApplyAiResumeOptimizationMethod(
  input: ApplyAiResumeOptimizationInput,
) {
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
 * 构造上传简历并识别为候选草稿 Method
 *
 * @param input 请求参数
 * @returns 简历导入识别请求 Method
 */
export function createRecognizeAiResumeImportMethod(input: RecognizeAiResumeImportInput) {
  const formData = new FormData()
  formData.append('file', input.file)

  return Alova.createMethod<AiResumeImportJob>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/resume-import/recognize',
    method: 'POST',
    accessToken: input.accessToken,
    body: formData,
    requestInit: input.requestInit,
    fallbackErrorMessage: '简历导入识别失败，请稍后重试',
  })
}

/**
 * 构造读取简历导入识别任务 Method
 *
 * @param input 请求参数
 * @returns 简历导入识别任务请求 Method
 */
export function createFetchAiResumeImportJobMethod(input: FetchAiResumeImportJobInput) {
  return Alova.createMethod<AiResumeImportJob>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: `/ai/resume-import/jobs/${input.jobId}`,
    accessToken: input.accessToken,
    fallbackErrorMessage: '简历导入识别任务加载失败，请稍后重试',
  })
}

interface ParsedSseMessage {
  event: AiResumeImportJobStreamEvent
  data: unknown
}

function parseSseMessage(rawMessage: string): ParsedSseMessage | null {
  const lines = rawMessage.split(/\r?\n/)
  let event: AiResumeImportJobStreamEvent = 'job.snapshot'
  const dataLines: string[] = []

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim() as AiResumeImportJobStreamEvent
      continue
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim())
    }
  }

  if (dataLines.length === 0) {
    return null
  }

  return {
    event,
    data: JSON.parse(dataLines.join('\n')) as unknown,
  }
}

function dispatchResumeImportJobStreamMessage(
  message: ParsedSseMessage,
  handlers: StreamAiResumeImportJobHandlers,
): boolean {
  if (message.event === 'job.heartbeat') {
    handlers.onHeartbeat?.(message.data as AiResumeImportJobHeartbeat)
    return false
  }

  if (message.event === 'job.progress_hint') {
    handlers.onProgressHint?.(message.data as AiResumeImportJobProgressHint)
    return false
  }

  const job = message.data as AiResumeImportJob

  if (message.event === 'job.completed') {
    handlers.onCompleted?.(job)
    return true
  }

  if (message.event === 'job.failed') {
    handlers.onFailed?.(job)
    return true
  }

  handlers.onSnapshot?.(job)
  return false
}

async function resolveStreamErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as { message?: string; traceId?: string }
      const message = payload.message?.trim()

      if (message) {
        return payload.traceId ? `${message} (traceId: ${payload.traceId})` : message
      }
    }

    const text = await response.text()

    if (text.trim()) {
      return text
    }
  } catch {}

  return '简历导入识别实时连接失败，请手动刷新状态'
}

/**
 * 使用 fetch + ReadableStream 订阅简历导入识别任务 SSE。
 *
 * 这里不用原生 EventSource，是因为 admin 需要通过 Authorization header 传递 Bearer Token。
 */
export function streamAiResumeImportJob(
  input: StreamAiResumeImportJobInput,
  handlers: StreamAiResumeImportJobHandlers,
): Promise<void> {
  return streamAiResumeImportJobInternal(input, handlers)
}

async function streamAiResumeImportJobInternal(
  input: StreamAiResumeImportJobInput,
  handlers: StreamAiResumeImportJobHandlers,
): Promise<void> {
  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  }

  if (input.accessToken) {
    headers.Authorization = `Bearer ${input.accessToken}`
  }

  const response = await fetch(
    joinApiUrl(input.apiBaseUrl, `/ai/resume-import/jobs/${input.jobId}/events`),
    {
      headers,
      method: 'GET',
      signal: input.signal,
    },
  )

  if (!response.ok) {
    throw new Error(await resolveStreamErrorMessage(response.clone()))
  }

  if (!response.body) {
    throw new Error('当前浏览器不支持读取简历导入识别实时事件')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const messages = buffer.split(/\n\n/)
      buffer = messages.pop() ?? ''

      for (const rawMessage of messages) {
        const parsedMessage = parseSseMessage(rawMessage.trim())

        if (!parsedMessage) {
          continue
        }

        const shouldStop = dispatchResumeImportJobStreamMessage(parsedMessage, handlers)

        if (shouldStop) {
          return
        }
      }
    }

    const finalMessage = parseSseMessage(buffer.trim())

    if (finalMessage) {
      dispatchResumeImportJobStreamMessage(finalMessage, handlers)
    }
  } finally {
    reader.releaseLock()
  }
}

/**
 * 构造读取简历导入识别结果 Method
 *
 * @param input 请求参数
 * @returns 简历导入识别结果请求 Method
 */
export function createFetchAiResumeImportResultMethod(
  input: FetchAiResumeImportResultInput,
) {
  return Alova.createMethod<AiResumeImportResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: `/ai/resume-import/results/${input.resultId}`,
    accessToken: input.accessToken,
    fallbackErrorMessage: '简历导入识别结果加载失败，请稍后重试',
  })
}

/**
 * 构造按模块回填简历导入结果 Method
 *
 * @param input 请求参数
 * @returns 回填请求 Method
 */
export function createApplyAiResumeImportMethod(input: ApplyAiResumeImportInput) {
  return Alova.createMethod<ApplyAiResumeImportResult>({
    apiBaseUrl: input.apiBaseUrl,
    pathname: '/ai/resume-import/apply',
    method: 'POST',
    accessToken: input.accessToken,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resultId: input.resultId,
      modules: input.modules,
    }),
    fallbackErrorMessage: '简历导入结果回填失败，请稍后重试',
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
      ((payload as { reports?: AiWorkbenchCachedReportSummary[] }).reports ??
        []) as AiWorkbenchCachedReportSummary[],
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

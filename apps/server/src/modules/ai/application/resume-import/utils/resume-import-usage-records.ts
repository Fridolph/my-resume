import type { AiService } from '../../services/ai.service'
import type { AiUsageRecordService } from '../../services/ai-usage-record.service'
import type {
  CachedResumeImportResult,
  RecognizeResumeImportInput,
  ResumeImportJobDetail,
  ResumeImportResultDetail,
} from '../types/resume-import.types'
import { ResumeImportMemoryStore } from './resume-import-memory-store'

interface ResumeImportUsageDependencies {
  aiService: AiService
  aiUsageRecordService: AiUsageRecordService
  memoryStore: ResumeImportMemoryStore
}

/** 读取内存结果；内存过期时回退到 ai_usage_records 中的成功快照。 */
export async function getCachedOrPersistedResumeImportResult(
  input: ResumeImportUsageDependencies & {
    resultId: string
  },
): Promise<CachedResumeImportResult> {
  const cachedResult = input.memoryStore.getResult(input.resultId)

  if (cachedResult) {
    return cachedResult
  }

  const persistedSnapshot = await input.aiUsageRecordService.findResumeImportSnapshotByResultId(
    input.resultId,
  )

  if (!persistedSnapshot) {
    return input.memoryStore.getResultOrThrow(input.resultId)
  }

  input.memoryStore.storeResult(persistedSnapshot)
  return persistedSnapshot
}

/** 将成功识别结果写入 AI 使用记录，便于后续回看与审计。 */
export async function recordResumeImportSuccess(
  input: ResumeImportUsageDependencies & {
    detail: ResumeImportResultDetail
    job: ResumeImportJobDetail
    upload: RecognizeResumeImportInput
  },
) {
  const cachedResult = input.memoryStore.getResultOrThrow(input.detail.resultId)
  const usageRecord = await input.aiUsageRecordService.recordSuccess({
    operationType: 'resume-import',
    scenario: 'resume-import',
    locale: input.detail.locale,
    inputPreview: `${input.detail.fileName} · ${input.detail.charCount} 字符`,
    summary: input.detail.summary,
    providerSummary: input.detail.providerSummary,
    generator: input.detail.providerSummary.mode === 'mock' ? 'mock-cache' : 'ai-provider',
    relatedResultId: input.detail.resultId,
    detail: {
      jobId: input.job.jobId,
      fileName: input.upload.originalname,
      fileSize: input.upload.size,
      candidateResume: cachedResult.candidateResume,
      draftUpdatedAt: cachedResult.draftUpdatedAt,
      createdAt: cachedResult.createdAt,
      formattedText: cachedResult.formattedText,
      rawText: cachedResult.rawText,
      resultDetail: input.detail,
      sourceHash: cachedResult.sourceHash,
    },
    durationMs: input.job.elapsedMs,
  })

  cachedResult.usageRecordId = usageRecord.id
}

/** 将失败识别 Job 写入 AI 使用记录；失败不能让用户只剩一个短暂 traceId。 */
export async function recordResumeImportFailure(
  input: ResumeImportUsageDependencies & {
    job: ResumeImportJobDetail
    upload: RecognizeResumeImportInput
  },
) {
  const providerSummary = input.aiService.getProviderSummary()

  await input.aiUsageRecordService.recordFailure({
    operationType: 'resume-import',
    scenario: 'resume-import',
    locale: 'zh',
    inputPreview: input.upload.originalname,
    providerSummary,
    generator: providerSummary.mode === 'mock' ? 'mock-cache' : 'ai-provider',
    errorMessage: input.job.error?.message ?? '简历导入识别失败',
    relatedResultId: input.job.resultId,
    detail: {
      jobId: input.job.jobId,
      fileName: input.upload.originalname,
      fileSize: input.upload.size,
      rawText: input.upload.buffer.toString('utf8'),
      currentStage: input.job.currentStage,
      error: input.job.error,
      steps: input.job.steps,
      durationMs: input.job.elapsedMs,
    },
    durationMs: input.job.elapsedMs,
  })
}

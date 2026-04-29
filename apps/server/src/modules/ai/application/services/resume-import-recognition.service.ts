import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { ResumePublicationService } from '../../../resume/resume-publication.service'
import {
  normalizeStandardResume,
  validateStandardResume,
  type StandardResume,
} from '../../../resume/domain/standard-resume'
import { AiService } from './ai.service'
import { AiUsageRecordService } from './ai-usage-record.service'
import { FileExtractionService } from './file-extraction.service'
import {
  RESUME_IMPORT_MAX_FILE_SIZE_BYTES,
  RESUME_IMPORT_MAX_TEXT_CHARS,
  RESUME_IMPORT_MIN_TEXT_CHARS,
  RESUME_IMPORT_MODULES,
} from '../resume-import/constants/resume-import.constants'
import type {
  ApplyResumeImportInput,
  ProviderResumeImportPayload,
  RecognizeResumeImportInput,
  ResumeImportJobStreamEvent,
  ResumeImportJobDetail,
  ResumeImportJobStage,
  ResumeImportJobStep,
  ResumeImportResultDetail,
} from '../resume-import/types/resume-import.types'
import { buildResumeImportModuleContents } from '../resume-import/utils/resume-import-content'
import { patchResumeImportCoreStrengthsFromText } from '../resume-import/utils/resume-import-core-strengths'
import {
  buildResumeImportModuleDiffs,
  isResumeImportModuleChanged,
} from '../resume-import/utils/resume-import-diff'
import { writeResumeImportAiLog } from '../resume-import/utils/resume-import-ai-logger'
import {
  mergeResumeImportFormatReports,
  normalizeResumeImportInputFormat,
} from '../resume-import/utils/resume-import-format'
import {
  cloneResumeImportJobDetail,
  completeResumeImportJob,
  createInitialResumeImportJobDetail,
  failResumeImportJob,
  moveResumeImportJobToStage,
  normalizeResumeImportErrorDetails,
  normalizeResumeImportErrorMessage,
  ResumeImportJobFailure,
  updateResumeImportJobStep,
} from '../resume-import/utils/resume-import-job'
import { parseMockResumeFromMarkdown } from '../resume-import/utils/resume-import-markdown-parser'
import { ResumeImportMemoryStore } from '../resume-import/utils/resume-import-memory-store'
import { generateProviderResumeImportRecognition } from '../resume-import/utils/resume-import-provider-recognition'
import { collectResumeImportWarnings } from '../resume-import/utils/resume-import-quality'
import { repairProviderResume } from '../resume-import/utils/resume-import-repair'
import {
  cloneResume,
  formatResumeImportFileSize,
  formatResumeImportValidationError,
  normalizeResumeImportModules,
  readFileExtension,
} from '../resume-import/utils/resume-import-shared'
import {
  getCachedOrPersistedResumeImportResult,
  recordResumeImportFailure,
  recordResumeImportSuccess,
} from '../resume-import/utils/resume-import-usage-records'

export type * from '../resume-import/types/resume-import.types'

/**
 * AI 简历导入识别用例服务。
 *
 * 这个服务只负责业务编排：接收上传文件、推进异步 Job、调用 AI/mock 生成候选草稿、构建 diff，并在用户确认后一次性写回 draft。
 * 纯解析、修复、diff、prompt 和 Job 状态操作都放在 resume-import 子域工具中，避免服务类继续膨胀。
 */
@Injectable()
export class ResumeImportRecognitionService {
  private readonly memoryStore = new ResumeImportMemoryStore()

  constructor(
    @Inject(FileExtractionService)
    private readonly fileExtractionService: FileExtractionService,
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(AiUsageRecordService)
    private readonly aiUsageRecordService: AiUsageRecordService,
    @Inject(ResumePublicationService)
    private readonly resumePublicationService: ResumePublicationService,
  ) {}

  /**
   * 启动简历导入识别异步任务。
   *
   * recognize 只创建 Job 并快速返回；文件内容校验、AI 调用和 schema 校验都在后台任务中推进。
   */
  recognize(input: RecognizeResumeImportInput): ResumeImportJobDetail {
    const jobId = randomUUID()
    const detail = createInitialResumeImportJobDetail(jobId)
    const job = {
      createdAt: detail.createdAt,
      detail,
    }

    this.memoryStore.storeJob(job)
    this.updateJobStep(jobId, 'accepted', {
      summary: `${input.originalname} · ${formatResumeImportFileSize(input.size)}`,
      details: ['上传请求已进入后台识别队列。'],
    })
    this.logJobStage(jobId, 'accepted', '上传请求已进入后台识别队列。', {
      charCount: input.buffer.length,
      traceId: input.traceId,
    })
    void this.runRecognitionJob(jobId, input)

    return cloneResumeImportJobDetail(job)
  }

  /** 读取异步识别任务状态。 */
  getJob(jobId: string): ResumeImportJobDetail {
    return cloneResumeImportJobDetail(this.memoryStore.getJobOrThrow(jobId))
  }

  /** 读取识别结果详情。 */
  async getResult(resultId: string): Promise<ResumeImportResultDetail> {
    return (
      await getCachedOrPersistedResumeImportResult({
        aiService: this.aiService,
        aiUsageRecordService: this.aiUsageRecordService,
        memoryStore: this.memoryStore,
        resultId,
      })
    ).detail
  }

  /** 订阅某个 Job 的状态变化，用于 SSE 实时推送。 */
  subscribeToJob(
    jobId: string,
    listener: (event: ResumeImportJobStreamEvent, job: ResumeImportJobDetail) => void,
  ) {
    return this.memoryStore.subscribeToJob(jobId, (event) => {
      listener(event, this.getJob(jobId))
    })
  }

  /**
   * 将用户确认的模块一次性写回当前 draft。
   *
   * MVP 中同一个 resultId 只能成功 apply 一次，避免“分多次写回”与 draftUpdatedAt 冲突保护产生歧义。
   */
  async apply(input: ApplyResumeImportInput) {
    const selectedModules = normalizeResumeImportModules(input.modules)
    const cachedResult = await getCachedOrPersistedResumeImportResult({
      aiService: this.aiService,
      aiUsageRecordService: this.aiUsageRecordService,
      memoryStore: this.memoryStore,
      resultId: input.resultId,
    })

    if (!cachedResult.detail.canApply) {
      throw new ConflictException('该识别结果已写回过草稿，请重新上传识别后再回填')
    }

    const draft = await this.resumePublicationService.getDraft()

    if (draft.updatedAt !== cachedResult.draftUpdatedAt) {
      throw new ConflictException('当前草稿已发生变化，请重新识别后再回填')
    }

    const nextResume = cloneResume(draft.resume)

    for (const selectedModule of selectedModules) {
      nextResume[selectedModule] = cloneResume(cachedResult.candidateResume)[
        selectedModule
      ] as never
    }

    const appliedModules = RESUME_IMPORT_MODULES.filter((module) =>
      isResumeImportModuleChanged(draft.resume, nextResume, module),
    )

    if (appliedModules.length === 0) {
      throw new BadRequestException('当前选择的模块没有实际变化可回填')
    }

    const validationResult = validateStandardResume(nextResume)

    if (!validationResult.valid) {
      throw new BadGatewayException(
        validationResult.errors[0] ?? '回填后的简历未通过结构校验',
      )
    }

    const updatedDraft = await this.resumePublicationService.updateDraft(nextResume)

    cachedResult.detail.canApply = false
    cachedResult.detail.appliedModules = appliedModules
    cachedResult.detail.appliedAt = new Date().toISOString()
    await this.aiUsageRecordService.updateResumeImportSnapshot(
      input.resultId,
      cachedResult,
    )

    return updatedDraft
  }

  /** 后台执行识别 Job，并把异常统一写入 Job 状态。 */
  private async runRecognitionJob(jobId: string, input: RecognizeResumeImportInput) {
    try {
      const detail = await this.createRecognitionResult(jobId, input)
      await recordResumeImportSuccess({
        aiService: this.aiService,
        aiUsageRecordService: this.aiUsageRecordService,
        detail,
        job: this.getJob(jobId),
        memoryStore: this.memoryStore,
        upload: input,
      })
      this.completeJob(jobId, detail.resultId)
    } catch (error) {
      const message = normalizeResumeImportErrorMessage(error)
      this.failJob(
        jobId,
        message,
        input.traceId,
        normalizeResumeImportErrorDetails(error),
      )
      writeResumeImportAiLog({
        error: message,
        jobId,
        provider: this.aiService.getProviderSummary().provider,
        stage: 'failed',
        stepSummary: '简历导入识别任务失败',
        traceId: input.traceId,
      })
      try {
        await recordResumeImportFailure({
          aiService: this.aiService,
          aiUsageRecordService: this.aiUsageRecordService,
          job: this.getJob(jobId),
          memoryStore: this.memoryStore,
          upload: input,
        })
      } catch {
        // 失败记录是辅助审计能力，不能覆盖原始 Job 失败原因。
      }
    }
  }

  /**
   * 执行从文件到候选草稿结果的完整识别链路。
   */
  private async createRecognitionResult(
    jobId: string,
    input: RecognizeResumeImportInput,
  ): Promise<ResumeImportResultDetail> {
    this.startJobStage(jobId, 'extracting')
    const extension = readFileExtension(input.originalname)

    if (extension !== 'md' && extension !== 'txt') {
      throw new BadRequestException('第一版仅支持上传 md/txt 简历文件')
    }

    if (input.size > RESUME_IMPORT_MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('简历文件不能超过 1MB，请精简后再上传')
    }

    const extracted = await this.fileExtractionService.extractText(input)
    this.updateJobStep(jobId, 'extracting', {
      summary: `${extracted.fileType.toUpperCase()} 文本提取完成，共 ${extracted.charCount} 字符。`,
      details: [`文件名：${extracted.fileName}`, `MIME：${extracted.mimeType}`],
    })
    this.logJobStage(
      jobId,
      'extracting',
      `${extracted.fileType.toUpperCase()} 文本提取完成，共 ${extracted.charCount} 字符。`,
      {
        charCount: extracted.charCount,
        traceId: input.traceId,
      },
    )

    this.startJobStage(jobId, 'text_validating')
    if (extracted.charCount < RESUME_IMPORT_MIN_TEXT_CHARS) {
      throw new BadRequestException('简历文本过短，无法稳定识别为结构化简历')
    }

    if (extracted.charCount > RESUME_IMPORT_MAX_TEXT_CHARS) {
      throw new BadRequestException('简历文本过长，请精简到 50000 字以内后再上传')
    }
    this.updateJobStep(jobId, 'text_validating', {
      summary: `文本边界校验通过：${extracted.charCount} 字符。`,
      details: [
        `允许范围：${RESUME_IMPORT_MIN_TEXT_CHARS} - ${RESUME_IMPORT_MAX_TEXT_CHARS} 字符。`,
      ],
    })
    this.logJobStage(
      jobId,
      'text_validating',
      `文本边界校验通过：${extracted.charCount} 字符。`,
      {
        charCount: extracted.charCount,
        traceId: input.traceId,
      },
    )

    this.startJobStage(jobId, 'raw_archiving')
    this.updateJobStep(jobId, 'raw_archiving', {
      summary: `已生成上传原文审计快照：${extracted.charCount} 字符。`,
      details: [
        `文件名：${extracted.fileName}`,
        'MVP 保存提取后的完整原文，不保存原始文件 buffer。',
      ],
    })
    this.logJobStage(
      jobId,
      'raw_archiving',
      `已生成上传原文审计快照：${extracted.charCount} 字符。`,
      {
        charCount: extracted.charCount,
        traceId: input.traceId,
      },
    )

    this.startJobStage(jobId, 'format_normalizing')
    const formatResult = normalizeResumeImportInputFormat({
      fileName: extracted.fileName,
      fileSize: input.size,
      rawText: extracted.text,
    })
    this.updateJobStep(jobId, 'format_normalizing', {
      summary: formatResult.formatReport.summary,
      details: [
        `原文 ${formatResult.formatReport.rawCharCount} 字符`,
        `规则清洗后 ${formatResult.formatReport.formattedCharCount} 字符`,
        ...formatResult.formatReport.warnings.slice(0, 3),
      ],
    })
    this.logJobStage(jobId, 'format_normalizing', formatResult.formatReport.summary, {
      charCount: formatResult.formattedText.length,
      sourceHash: formatResult.sourceSnapshot.sourceHash,
      traceId: input.traceId,
      warnings: formatResult.formatReport.warnings,
    })

    this.startJobStage(jobId, 'safety_filtering')
    this.updateJobStep(jobId, 'safety_filtering', {
      summary:
        formatResult.formatReport.discardedLineCount > 0
          ? `已丢弃 ${formatResult.formatReport.discardedLineCount} 条风险或无关内容。`
          : '未发现需要丢弃的明显风险内容。',
      details: [
        `风险类型：${formatResult.formatReport.safetyFlags.join('、') || '无'}`,
        ...formatResult.formatReport.discardedItems
          .slice(0, 3)
          .map((item) => `${item.reason} ${item.summary}`),
      ],
    })
    this.logJobStage(
      jobId,
      'safety_filtering',
      formatResult.formatReport.discardedLineCount > 0
        ? `已丢弃 ${formatResult.formatReport.discardedLineCount} 条风险或无关内容。`
        : '未发现需要丢弃的明显风险内容。',
      {
        charCount: formatResult.formattedText.length,
        sourceHash: formatResult.sourceSnapshot.sourceHash,
        traceId: input.traceId,
        warnings: formatResult.formatReport.warnings,
      },
    )

    const draft = await this.resumePublicationService.getDraft()
    const providerSummary = this.aiService.getProviderSummary()

    this.startJobStage(jobId, 'ai_generating')
    const aiStartedAt = Date.now()
    const payload =
      providerSummary.mode === 'mock'
        ? {
            resume: parseMockResumeFromMarkdown(formatResult.formattedText),
            summary: '已从上传简历中识别出结构化候选草稿。',
            formatReport: {
              summary: 'Mock 模式已使用规则清洗中间稿生成候选草稿。',
            },
          }
        : await generateProviderResumeImportRecognition({
            aiService: this.aiService,
            aiStartedAt,
            charCount: formatResult.formattedText.length,
            jobId,
            providerSummary,
            sourceHash: formatResult.sourceSnapshot.sourceHash,
            startJobStage: this.startJobStage.bind(this),
            text: formatResult.formattedText,
            traceId: input.traceId,
            updateJobStep: this.updateJobStep.bind(this),
          })
    const finalFormatReport = mergeResumeImportFormatReports(
      formatResult.formatReport,
      payload.formatReport,
    )

    if (providerSummary.mode === 'mock') {
      this.completeMockGenerationSteps(jobId, providerSummary, aiStartedAt)
    }

    this.startJobStage(jobId, 'schema_validating')
    const repairResult = repairProviderResume(payload.resume)
    const coreStrengthsPatch = patchResumeImportCoreStrengthsFromText({
      resume: repairResult.resume,
      text: `${formatResult.formattedText}\n\n${formatResult.rawText}`,
    })
    const repairMessages = [
      ...repairResult.repairMessages,
      ...coreStrengthsPatch.repairMessages,
    ]
    const candidateResume = normalizeStandardResume(coreStrengthsPatch.resume)
    const validationResult = validateStandardResume(candidateResume)

    if (!validationResult.valid) {
      const readableErrors = validationResult.errors.map(
        formatResumeImportValidationError,
      )
      const firstError = readableErrors[0] ?? 'AI 识别结果未通过简历结构校验'

      this.updateJobStep(jobId, 'schema_validating', {
        summary: '自动修复后仍未通过 StandardResume 结构校验。',
        details: [...readableErrors.slice(0, 5), ...validationResult.errors.slice(0, 5)],
      })
      throw new ResumeImportJobFailure(
        `AI 识别结果修复后仍未通过结构校验：${firstError}`,
        [...readableErrors.slice(0, 5), ...validationResult.errors.slice(0, 5)],
      )
    }
    this.updateJobStep(jobId, 'schema_validating', {
      summary:
        repairMessages.length > 0
          ? `结构校验通过，自动修复 ${repairMessages.length} 处 AI 输出形状。`
          : '结构校验通过，AI 输出已符合 StandardResume。',
      details: repairMessages.slice(0, 8),
    })
    this.logJobStage(
      jobId,
      'schema_validating',
      repairMessages.length > 0
        ? `结构校验通过，自动修复 ${repairMessages.length} 处 AI 输出形状。`
        : '结构校验通过，AI 输出已符合 StandardResume。',
      {
        moduleStats: {
          education: candidateResume.education.length,
          experiences: candidateResume.experiences.length,
          projects: candidateResume.projects.length,
          skills: candidateResume.skills.length,
          highlights: candidateResume.highlights.length,
        },
        sourceHash: formatResult.sourceSnapshot.sourceHash,
        traceId: input.traceId,
      },
    )

    return this.buildRecognitionResult({
      jobId,
      extracted,
      draftResume: draft.resume,
      draftUpdatedAt: draft.updatedAt,
      candidateResume,
      providerSummary,
      payload,
      repairMessages,
      formatReport: finalFormatReport,
      formattedText: formatResult.formattedText,
      rawText: formatResult.rawText,
      sourceSnapshot: formatResult.sourceSnapshot,
      traceId: input.traceId,
    })
  }

  /**
   * mock 模式没有真实 JSON 文本输出，但仍补齐 ai/json 两个阶段的可观测摘要。
   */
  private completeMockGenerationSteps(
    jobId: string,
    providerSummary: { provider: string; model: string },
    aiStartedAt: number,
  ) {
    this.updateJobStep(jobId, 'ai_generating', {
      summary: `Mock 识别完成，用时 ${Date.now() - aiStartedAt} ms。`,
      details: [
        `Provider：${providerSummary.provider}`,
        `模型：${providerSummary.model}`,
      ],
    })
    this.startJobStage(jobId, 'json_parsing')
    this.updateJobStep(jobId, 'json_parsing', {
      summary: 'Mock 模式已生成结构化对象，跳过 AI JSON 文本解析。',
      details: ['测试模式仍会继续执行 repair、normalize 和 schema validation。'],
    })
  }

  /**
   * 根据校验后的候选草稿构建结果看台数据。
   *
   * 这里集中完成 warnings 汇总、changedModules 计算、模块统计和内存缓存写入。
   */
  private buildRecognitionResult(input: {
    jobId: string
    extracted: {
      fileName: string
      fileType: string
      charCount: number
    }
    draftResume: StandardResume
    draftUpdatedAt: string
    candidateResume: StandardResume
    providerSummary: { provider: string; model: string; mode: string }
    payload: ProviderResumeImportPayload
    repairMessages: string[]
    formatReport: ResumeImportResultDetail['formatReport']
    formattedText: string
    rawText: string
    sourceSnapshot: ResumeImportResultDetail['sourceSnapshot']
    traceId?: string
  }): ResumeImportResultDetail {
    this.startJobStage(input.jobId, 'diff_building')
    const warnings = [
      ...collectResumeImportWarnings(input.candidateResume),
      ...(input.repairMessages.length > 0
        ? [
            `AI 输出已自动修正 ${input.repairMessages.length} 处字段形状，详情请查看各模块质量提醒。`,
          ]
        : []),
      ...(input.formatReport?.warnings ?? []),
      ...(input.payload.warnings ?? []),
    ]
    const changedModules = RESUME_IMPORT_MODULES.filter((module) =>
      isResumeImportModuleChanged(input.draftResume, input.candidateResume, module),
    )
    const createdAt = new Date().toISOString()
    const resultId = randomUUID()
    const moduleContentWarnings = [
      ...collectResumeImportWarnings(input.candidateResume),
      ...input.repairMessages.map((message) => `AI 输出已自动修正：${message}`),
      ...(input.formatReport?.warnings ?? []),
      ...(input.payload.warnings ?? []),
    ]
    const detail: ResumeImportResultDetail = {
      resultId,
      locale: 'zh',
      fileName: input.extracted.fileName,
      fileType: input.extracted.fileType as 'txt' | 'md',
      charCount: input.extracted.charCount,
      summary: input.payload.summary ?? '已生成结构化候选草稿，请确认后按模块回填。',
      warnings,
      changedModules,
      moduleDiffs: buildResumeImportModuleDiffs(
        input.draftResume,
        input.candidateResume,
        warnings,
      ),
      moduleContents: buildResumeImportModuleContents(
        input.draftResume,
        input.candidateResume,
        moduleContentWarnings,
      ),
      moduleStats: {
        education: input.candidateResume.education.length,
        experiences: input.candidateResume.experiences.length,
        projects: input.candidateResume.projects.length,
        skills: input.candidateResume.skills.length,
        highlights: input.candidateResume.highlights.length,
      },
      sourceSnapshot: input.sourceSnapshot,
      formatReport: input.formatReport,
      createdAt,
      canApply: true,
      appliedModules: [],
      providerSummary: input.providerSummary,
    }

    this.updateJobStep(input.jobId, 'diff_building', {
      summary: `模块 diff 已生成：${changedModules.length} 个模块存在变化。`,
      details: [
        `教育 ${detail.moduleStats.education} 条`,
        `工作 ${detail.moduleStats.experiences} 条`,
        `项目 ${detail.moduleStats.projects} 条`,
        `技能 ${detail.moduleStats.skills} 组`,
        `亮点 ${detail.moduleStats.highlights} 条`,
      ],
    })
    writeResumeImportAiLog({
      jobId: input.jobId,
      model: input.providerSummary.model,
      moduleStats: detail.moduleStats,
      provider: input.providerSummary.provider,
      sourceHash: input.sourceSnapshot?.sourceHash,
      stage: 'diff_building',
      stepSummary: `模块 diff 已生成：${changedModules.length} 个模块存在变化。`,
      traceId: input.traceId,
      warnings,
    })

    this.memoryStore.storeResult({
      candidateResume: input.candidateResume,
      createdAt,
      detail,
      draftUpdatedAt: input.draftUpdatedAt,
      formattedText: input.formattedText,
      rawText: input.rawText,
      sourceHash: input.sourceSnapshot?.sourceHash,
    })

    return detail
  }

  /**
   * 进入指定 Job 阶段，统一通过 Job helper 更新阶段时间线。
   */
  private startJobStage(jobId: string, stage: ResumeImportJobStage) {
    moveResumeImportJobToStage(this.memoryStore.getJobOrThrow(jobId), stage)
    this.memoryStore.notifyJob(jobId, 'job.snapshot')
  }

  /**
   * 为当前 Job 阶段补充摘要、详情或错误文案。
   */
  private updateJobStep(
    jobId: string,
    stage: ResumeImportJobStage,
    update: Pick<ResumeImportJobStep, 'summary' | 'details' | 'message'>,
  ) {
    updateResumeImportJobStep(this.memoryStore.getJobOrThrow(jobId), stage, update)
    this.memoryStore.notifyJob(jobId, 'job.snapshot')
  }

  /**
   * 标记 Job 完成，并暴露最终 resultId 供前端跳转结果页。
   */
  private completeJob(jobId: string, resultId: string) {
    completeResumeImportJob(this.memoryStore.getJobOrThrow(jobId), resultId)
    this.logJobStage(jobId, 'completed', `简历导入识别完成：${resultId}`)
    this.memoryStore.notifyJob(jobId, 'job.completed')
  }

  /**
   * 标记 Job 失败；traceId 和 details 会透出到轮询接口，方便定位阶段问题。
   */
  private failJob(
    jobId: string,
    message: string,
    traceId?: string,
    details: string[] = [],
  ) {
    failResumeImportJob(this.memoryStore.getJobOrThrow(jobId), message, traceId, details)
    this.memoryStore.notifyJob(jobId, 'job.failed')
  }

  private logJobStage(
    jobId: string,
    stage: ResumeImportJobStage,
    stepSummary: string,
    extra: Partial<Parameters<typeof writeResumeImportAiLog>[0]> = {},
  ) {
    const providerSummary = this.aiService.getProviderSummary()

    writeResumeImportAiLog({
      jobId,
      model: providerSummary.model,
      provider: providerSummary.provider,
      stage,
      stepSummary,
      ...extra,
    })
  }
}

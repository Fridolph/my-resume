import type { AiService } from '../../services/ai.service'
import type { AiProviderSummary } from '../../../domain/ports/ai-provider.interface'
import { buildResumeImportRecognitionPrompt } from '../prompts/resume-import-recognition.prompt'
import type {
  ProviderResumeImportPayload,
  ResumeImportJobStage,
  ResumeImportJobStep,
} from '../types/resume-import.types'
import { writeResumeImportAiLog } from './resume-import-ai-logger'
import { ResumeImportJobFailure } from './resume-import-job'
import {
  parseResumeImportStructuredOutput,
  resumeImportStructuredOutputSchema,
  selectResumeImportStructuredOutputMethod,
} from './resume-import-structured-output'

interface GenerateProviderRecognitionInput {
  aiService: AiService
  aiStartedAt: number
  charCount: number
  jobId: string
  providerSummary: AiProviderSummary
  sourceHash?: string
  startJobStage: (jobId: string, stage: ResumeImportJobStage) => void
  text: string
  traceId?: string
  updateJobStep: (
    jobId: string,
    stage: ResumeImportJobStage,
    update: Pick<ResumeImportJobStep, 'summary' | 'details' | 'message'>,
  ) => void
}

/**
 * 调用真实 AI provider 生成简历导入 payload。
 *
 * 这里刻意不再回退到“完整 JSON 文本生成”，避免结构化输出失败后追加第二次
 * 3-5 分钟长调用，把用户等待从 3 分钟拉长到 10 分钟且仍可能因截断失败。
 */
export async function generateProviderResumeImportRecognition(
  input: GenerateProviderRecognitionInput,
): Promise<ProviderResumeImportPayload> {
  const prompt = buildResumeImportRecognitionPrompt(input.text)
  const method = selectResumeImportStructuredOutputMethod({
    model: input.providerSummary.model,
    provider: input.providerSummary.provider,
  })
  let partialChunkCount = 0
  let lastPartialLogAt = 0

  try {
    const result = await input.aiService.generateStructuredObjectStream({
      method,
      onPartialObject: (partialObject) => {
        partialChunkCount += 1

        const now = Date.now()

        if (now - lastPartialLogAt < 15_000) {
          return
        }

        lastPartialLogAt = now
        writeResumeImportAiLog({
          charCount: input.charCount,
          durationMs: now - input.aiStartedAt,
          fallbackUsed: false,
          jobId: input.jobId,
          langChainSucceeded: undefined,
          method,
          model: input.providerSummary.model,
          promptCharCount: prompt.length,
          provider: input.providerSummary.provider,
          rawOutput: partialObject,
          sourceHash: input.sourceHash,
          stage: 'ai_generating',
          stepSummary: `结构化流式输出接收中：第 ${partialChunkCount} 个增量。`,
          traceId: input.traceId,
        })
      },
      prompt,
      schema: resumeImportStructuredOutputSchema,
      schemaDescription:
        '提取中文简历为 StandardResume 候选草稿，同时返回输入治理报告和质量提醒。',
      schemaName: 'ResumeImportRecognitionPayload',
      systemPrompt:
        '你是一个简历结构化识别助手。必须通过工具调用返回结构化对象，不要输出自由文本，不要虚构原文没有的信息。',
      temperature: 0,
    })
    const payload = parseResumeImportStructuredOutput(result.value)

    input.updateJobStep(input.jobId, 'ai_generating', {
      summary: `AI 候选草稿生成完成，用时 ${Date.now() - input.aiStartedAt} ms。`,
      details: [
        `结构化输出：LangChain tool-call stream / ${method}`,
        `流式增量：${partialChunkCount} 个`,
        '已收到结构化对象，准备进入业务校验。',
      ],
    })
    input.startJobStage(input.jobId, 'json_parsing')
    input.updateJobStep(input.jobId, 'json_parsing', {
      summary: 'LangChain structured output 解析成功。',
      details: [
        `结构化方法：${method}`,
        `流式增量：${partialChunkCount} 个`,
        `顶层字段：${Object.keys(payload).join(', ') || '无'}`,
      ],
    })
    writeResumeImportAiLog({
      charCount: input.charCount,
      durationMs: Date.now() - input.aiStartedAt,
      fallbackUsed: false,
      jobId: input.jobId,
      langChainSucceeded: true,
      method,
      model: input.providerSummary.model,
      promptCharCount: prompt.length,
      provider: input.providerSummary.provider,
      rawOutput: result.value,
      sourceHash: input.sourceHash,
      stage: 'ai_generating',
      stepSummary: 'LangChain tool-call structured stream succeeded',
      traceId: input.traceId,
      warnings: payload.warnings,
    })

    return payload
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知结构化输出错误'

    input.updateJobStep(input.jobId, 'ai_generating', {
      summary: 'AI 结构化流式输出失败，已停止后续长耗时重试。',
      details: [
        `结构化方法：${method}`,
        `流式增量：${partialChunkCount} 个`,
        `结构化错误：${message}`,
        '为避免识别链路从 3-5 分钟拉长到 10 分钟，本轮不再回退到完整 JSON 文本生成。',
      ],
    })
    writeResumeImportAiLog({
      charCount: input.charCount,
      durationMs: Date.now() - input.aiStartedAt,
      error: message,
      fallbackUsed: false,
      jobId: input.jobId,
      langChainSucceeded: false,
      method,
      model: input.providerSummary.model,
      promptCharCount: prompt.length,
      provider: input.providerSummary.provider,
      sourceHash: input.sourceHash,
      stage: 'ai_generating',
      stepSummary: 'LangChain tool-call structured stream failed; no long fallback',
      traceId: input.traceId,
    })

    throw new ResumeImportJobFailure(`AI 结构化识别失败：${message}`, [
      `结构化方法：${method}`,
      `流式增量：${partialChunkCount} 个`,
      `错误：${message}`,
      '已停止完整 JSON 文本 fallback，避免额外长耗时调用。',
    ])
  }
}

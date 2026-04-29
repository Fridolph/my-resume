import { RESUME_IMPORT_JOB_STEPS } from '../constants/resume-import.constants'
import type {
  CachedResumeImportJob,
  ResumeImportJobDetail,
  ResumeImportJobStage,
  ResumeImportJobStep,
} from '../types/resume-import.types'

/**
 * 可携带阶段诊断详情的 Job 失败。
 */
export class ResumeImportJobFailure extends Error {
  constructor(
    message: string,
    readonly details: string[] = [],
  ) {
    super(message)
  }
}

/**
 * 创建初始 Job 详情。
 */
export function createInitialResumeImportJobDetail(
  jobId: string,
): Omit<ResumeImportJobDetail, 'elapsedMs'> {
  const now = new Date().toISOString()

  return {
    jobId,
    status: 'running',
    currentStage: 'accepted',
    steps: RESUME_IMPORT_JOB_STEPS.map((step) => ({
      ...step,
      status: step.stage === 'accepted' ? 'running' : 'pending',
      ...(step.stage === 'accepted' ? { startedAt: now } : {}),
    })),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * 克隆 Job 详情，并按任务状态计算 elapsedMs。
 */
export function cloneResumeImportJobDetail(
  job: CachedResumeImportJob,
): ResumeImportJobDetail {
  const createdAtTime = new Date(job.createdAt).getTime()
  const endTime =
    job.detail.status === 'running'
      ? Date.now()
      : new Date(job.detail.updatedAt).getTime()

  return {
    ...job.detail,
    steps: job.detail.steps.map((step) => ({
      ...step,
      details: step.details ? [...step.details] : undefined,
    })),
    error: job.detail.error ? { ...job.detail.error } : undefined,
    elapsedMs: Math.max(0, endTime - createdAtTime),
  }
}

/**
 * 将未知错误归一化为 Job 失败文案。
 */
export function normalizeResumeImportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return '简历导入识别失败，请稍后重试'
}

/**
 * 读取 Job 失败携带的诊断详情。
 */
export function normalizeResumeImportErrorDetails(error: unknown): string[] {
  return error instanceof ResumeImportJobFailure ? error.details : []
}

/**
 * 根据目标阶段推进 Job 时间线。
 */
export function moveResumeImportJobToStage(
  job: CachedResumeImportJob,
  stage: ResumeImportJobStage,
) {
  const now = new Date().toISOString()
  const activeIndex = RESUME_IMPORT_JOB_STEPS.findIndex((step) => step.stage === stage)

  job.detail.currentStage = stage
  job.detail.updatedAt = now
  job.detail.steps = job.detail.steps.map((step, index) => {
    if (activeIndex < 0) {
      return step
    }

    if (index < activeIndex) {
      return {
        ...step,
        status: 'completed',
        completedAt: step.completedAt ?? now,
      }
    }

    if (index === activeIndex) {
      return {
        ...step,
        status: 'running',
        startedAt: step.startedAt ?? now,
      }
    }

    return {
      ...step,
      status: 'pending',
    }
  })
}

/**
 * 更新某个 Job 阶段的摘要、详情或失败文案。
 */
export function updateResumeImportJobStep(
  job: CachedResumeImportJob,
  stage: ResumeImportJobStage,
  update: Pick<ResumeImportJobStep, 'summary' | 'details' | 'message'>,
) {
  job.detail.updatedAt = new Date().toISOString()
  job.detail.steps = job.detail.steps.map((step) =>
    step.stage === stage
      ? {
          ...step,
          ...update,
        }
      : step,
  )
}

/**
 * 标记 Job 完成并补齐所有阶段时间。
 */
export function completeResumeImportJob(job: CachedResumeImportJob, resultId: string) {
  const now = new Date().toISOString()

  job.detail.status = 'completed'
  job.detail.currentStage = 'completed'
  job.detail.resultId = resultId
  job.detail.updatedAt = now
  job.detail.steps = job.detail.steps.map((step) => ({
    ...step,
    status: 'completed',
    startedAt: step.startedAt ?? now,
    completedAt: step.completedAt ?? now,
  }))
}

/**
 * 标记 Job 失败，并把错误挂到当前 running 阶段。
 */
export function failResumeImportJob(
  job: CachedResumeImportJob,
  message: string,
  traceId?: string,
  details: string[] = [],
) {
  const now = new Date().toISOString()

  job.detail.status = 'failed'
  job.detail.currentStage = 'failed'
  job.detail.error = {
    message,
    ...(traceId ? { traceId } : {}),
  }
  job.detail.updatedAt = now
  job.detail.steps = job.detail.steps.map((step) => {
    if (step.status === 'running') {
      return {
        ...step,
        status: 'failed',
        completedAt: now,
        message,
        details: details.length > 0 ? details : step.details,
      }
    }

    return step
  })
}

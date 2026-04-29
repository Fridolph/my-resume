import { NotFoundException } from '@nestjs/common'

import {
  RESUME_IMPORT_JOB_TTL_MS,
  RESUME_IMPORT_MAX_JOB_COUNT,
  RESUME_IMPORT_MAX_RESULT_COUNT,
  RESUME_IMPORT_RESULT_TTL_MS,
} from '../constants/resume-import.constants'
import type {
  CachedResumeImportJob,
  CachedResumeImportResult,
  ResumeImportJobStreamEvent,
} from '../types/resume-import.types'

type ResumeImportJobSubscriber = (event: ResumeImportJobStreamEvent) => void

/**
 * 简历导入识别的 MVP 内存缓存。
 *
 * 当前只服务单实例开发和演示：服务重启会丢失，生产化后可替换为数据库或队列存储。
 */
export class ResumeImportMemoryStore {
  private readonly resultMap = new Map<string, CachedResumeImportResult>()
  private readonly resultInsertionOrder: string[] = []
  private readonly jobMap = new Map<string, CachedResumeImportJob>()
  private readonly jobInsertionOrder: string[] = []
  private readonly jobSubscribers = new Map<string, Set<ResumeImportJobSubscriber>>()

  /** 写入识别结果，并执行 TTL / 容量清理。 */
  storeResult(input: CachedResumeImportResult) {
    this.pruneExpiredResults()
    this.resultMap.set(input.detail.resultId, input)
    this.resultInsertionOrder.push(input.detail.resultId)
    this.pruneOverflowResults()
  }

  /** 写入异步任务，并执行 TTL / 容量清理。 */
  storeJob(input: CachedResumeImportJob) {
    this.pruneExpiredJobs()
    this.jobMap.set(input.detail.jobId, input)
    this.jobInsertionOrder.push(input.detail.jobId)
    this.pruneOverflowJobs()
  }

  /** 读取异步任务；不存在或过期时抛出用户可读错误。 */
  getJobOrThrow(jobId: string): CachedResumeImportJob {
    this.pruneExpiredJobs()
    const job = this.jobMap.get(jobId)

    if (!job) {
      throw new NotFoundException('当前简历导入识别任务已失效，请重新上传识别')
    }

    return job
  }

  /** 读取识别结果；不存在或过期时抛出用户可读错误。 */
  getResultOrThrow(resultId: string): CachedResumeImportResult {
    this.pruneExpiredResults()
    const result = this.resultMap.get(resultId)

    if (!result) {
      throw new NotFoundException('当前简历导入识别结果已失效，请重新上传识别')
    }

    return result
  }

  /** 尝试读取识别结果；不存在或过期时返回 null，供数据库快照兜底。 */
  getResult(resultId: string): CachedResumeImportResult | null {
    this.pruneExpiredResults()
    return this.resultMap.get(resultId) ?? null
  }

  /** 订阅某个 Job 的状态变化；当前只服务单实例 SSE。 */
  subscribeToJob(jobId: string, subscriber: ResumeImportJobSubscriber) {
    this.getJobOrThrow(jobId)
    const subscribers = this.jobSubscribers.get(jobId) ?? new Set()

    subscribers.add(subscriber)
    this.jobSubscribers.set(jobId, subscribers)

    return () => {
      subscribers.delete(subscriber)

      if (subscribers.size === 0) {
        this.jobSubscribers.delete(jobId)
      }
    }
  }

  /** 通知订阅者当前 Job 已发生变化。 */
  notifyJob(jobId: string, event: ResumeImportJobStreamEvent) {
    const subscribers = this.jobSubscribers.get(jobId)

    if (!subscribers) {
      return
    }

    for (const subscriber of subscribers) {
      subscriber(event)
    }
  }

  private pruneExpiredResults() {
    const now = Date.now()

    for (const [resultId, result] of this.resultMap.entries()) {
      if (now - new Date(result.createdAt).getTime() <= RESUME_IMPORT_RESULT_TTL_MS) {
        continue
      }

      this.resultMap.delete(resultId)
      this.removeFromResultInsertionOrder(resultId)
    }
  }

  private pruneOverflowResults() {
    while (this.resultInsertionOrder.length > RESUME_IMPORT_MAX_RESULT_COUNT) {
      const oldestResultId = this.resultInsertionOrder.shift()

      if (!oldestResultId) {
        return
      }

      this.resultMap.delete(oldestResultId)
    }
  }

  private removeFromResultInsertionOrder(resultId: string) {
    const index = this.resultInsertionOrder.indexOf(resultId)

    if (index >= 0) {
      this.resultInsertionOrder.splice(index, 1)
    }
  }

  private pruneExpiredJobs() {
    const now = Date.now()

    for (const [jobId, job] of this.jobMap.entries()) {
      if (now - new Date(job.createdAt).getTime() <= RESUME_IMPORT_JOB_TTL_MS) {
        continue
      }

      this.jobMap.delete(jobId)
      this.jobSubscribers.delete(jobId)
      this.removeFromJobInsertionOrder(jobId)
    }
  }

  private pruneOverflowJobs() {
    while (this.jobInsertionOrder.length > RESUME_IMPORT_MAX_JOB_COUNT) {
      const oldestJobId = this.jobInsertionOrder.shift()

      if (!oldestJobId) {
        return
      }

      this.jobMap.delete(oldestJobId)
      this.jobSubscribers.delete(oldestJobId)
    }
  }

  private removeFromJobInsertionOrder(jobId: string) {
    const index = this.jobInsertionOrder.indexOf(jobId)

    if (index >= 0) {
      this.jobInsertionOrder.splice(index, 1)
    }
  }
}

import { Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import type { AnalysisLocale } from './analysis-report-cache.service'
import type {
  AiResumeOptimizationResultDetail,
  ResumeOptimizationModule,
  ResumeOptimizationPatch,
} from './ai-resume-optimization.service'

interface ResumeOptimizationDisplayDetailsByLocale {
  en?: AiResumeOptimizationResultDetail
  zh?: AiResumeOptimizationResultDetail
}

export interface StoreResumeOptimizationResultInput {
  changedModules: ResumeOptimizationModule[]
  createdAt: string
  detailsByLocale: ResumeOptimizationDisplayDetailsByLocale
  draftUpdatedAt: string
  patch: ResumeOptimizationPatch
}

export interface CachedResumeOptimizationResult {
  changedModules: ResumeOptimizationModule[]
  createdAt: string
  detailsByLocale: ResumeOptimizationDisplayDetailsByLocale
  draftUpdatedAt: string
  patch: ResumeOptimizationPatch
  resultId: string
}

const RESULT_TTL_MS = 30 * 60 * 1000
const MAX_RESULT_COUNT = 20

@Injectable()
export class ResumeOptimizationResultCacheService {
  private readonly resultMap = new Map<string, CachedResumeOptimizationResult>()
  private readonly insertionOrder: string[] = []

  storeResult(input: StoreResumeOptimizationResultInput): CachedResumeOptimizationResult {
    this.pruneExpiredResults()

    const resultId = randomUUID()
    const detailWithResultId = this.attachResultId(input.detailsByLocale, resultId)
    const nextResult: CachedResumeOptimizationResult = {
      ...input,
      detailsByLocale: detailWithResultId,
      resultId,
    }

    this.resultMap.set(resultId, nextResult)
    this.insertionOrder.push(resultId)
    this.pruneOverflowResults()

    return nextResult
  }

  getResultDetail(
    resultId: string,
    locale: AnalysisLocale,
  ): AiResumeOptimizationResultDetail {
    const result = this.getResultOrThrow(resultId)
    const detail = result.detailsByLocale[locale] ?? result.detailsByLocale.zh

    if (!detail) {
      throw new NotFoundException('当前优化结果已失效，请回到工作台重新生成')
    }

    return detail
  }

  getResultForApply(resultId: string): CachedResumeOptimizationResult {
    return this.getResultOrThrow(resultId)
  }

  private attachResultId(
    detailsByLocale: ResumeOptimizationDisplayDetailsByLocale,
    resultId: string,
  ): ResumeOptimizationDisplayDetailsByLocale {
    return {
      zh: detailsByLocale.zh
        ? {
            ...detailsByLocale.zh,
            resultId,
          }
        : undefined,
      en: detailsByLocale.en
        ? {
            ...detailsByLocale.en,
            resultId,
          }
        : undefined,
    }
  }

  private getResultOrThrow(resultId: string): CachedResumeOptimizationResult {
    this.pruneExpiredResults()
    const result = this.resultMap.get(resultId)

    if (!result) {
      throw new NotFoundException('当前优化结果已失效，请回到工作台重新生成')
    }

    return result
  }

  private pruneExpiredResults() {
    const now = Date.now()

    for (const [resultId, result] of this.resultMap.entries()) {
      if (now - new Date(result.createdAt).getTime() <= RESULT_TTL_MS) {
        continue
      }

      this.resultMap.delete(resultId)
      this.removeFromInsertionOrder(resultId)
    }
  }

  private pruneOverflowResults() {
    while (this.insertionOrder.length > MAX_RESULT_COUNT) {
      const oldestResultId = this.insertionOrder.shift()

      if (!oldestResultId) {
        return
      }

      this.resultMap.delete(oldestResultId)
    }
  }

  private removeFromInsertionOrder(resultId: string) {
    const resultIndex = this.insertionOrder.indexOf(resultId)

    if (resultIndex >= 0) {
      this.insertionOrder.splice(resultIndex, 1)
    }
  }
}

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ResumeOptimizationResultCacheService } from '../resume-optimization-result-cache.service'

describe('ResumeOptimizationResultCacheService', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-15T00:00:00.000Z'))
  })

  it('should store and read locale-aware result detail', () => {
    const service = new ResumeOptimizationResultCacheService()
    const stored = service.storeResult({
      changedModules: ['profile'],
      createdAt: '2026-04-15T00:00:00.000Z',
      detailsByLocale: {
        zh: {
          resultId: '',
          locale: 'zh',
          summary: '已生成结构化建议',
          focusAreas: ['强化摘要'],
          changedModules: ['profile'],
          moduleDiffs: [],
          createdAt: '2026-04-15T00:00:00.000Z',
          providerSummary: {
            provider: 'qiniu',
            model: 'deepseek-v3',
            mode: 'openai-compatible',
          },
        },
      },
      draftUpdatedAt: '2026-04-15T00:00:00.000Z',
      patch: {
        profile: {
          summary: {
            zh: '建议摘要',
            en: 'Suggested summary',
          },
        },
      },
    })

    const detail = service.getResultDetail(stored.resultId, 'zh')

    expect(detail.resultId).toBe(stored.resultId)
    expect(detail.summary).toBe('已生成结构化建议')
    expect(service.getResultForApply(stored.resultId).patch.profile?.summary?.zh).toBe(
      '建议摘要',
    )
  })

  it('should evict expired results', () => {
    const service = new ResumeOptimizationResultCacheService()
    const stored = service.storeResult({
      changedModules: ['profile'],
      createdAt: '2026-04-15T00:00:00.000Z',
      detailsByLocale: {
        zh: {
          resultId: '',
          locale: 'zh',
          summary: '已生成结构化建议',
          focusAreas: ['强化摘要'],
          changedModules: ['profile'],
          moduleDiffs: [],
          createdAt: '2026-04-15T00:00:00.000Z',
          providerSummary: {
            provider: 'qiniu',
            model: 'deepseek-v3',
            mode: 'openai-compatible',
          },
        },
      },
      draftUpdatedAt: '2026-04-15T00:00:00.000Z',
      patch: {},
    })

    vi.setSystemTime(new Date('2026-04-15T00:31:00.000Z'))

    expect(() => service.getResultDetail(stored.resultId, 'zh')).toThrow(
      '当前优化结果已失效，请回到工作台重新生成',
    )
  })
})

import { describe, expect, it, vi } from 'vitest'

import { ResumePublicationService } from '../../resume/resume-publication.service'
import {
  createExampleStandardResume,
  type StandardResume,
} from '../../resume/domain/standard-resume'
import { AiService } from '../ai.service'
import { AiResumeOptimizationService } from '../ai-resume-optimization.service'
import { ResumeOptimizationResultCacheService } from '../resume-optimization-result-cache.service'

describe('AiResumeOptimizationService', () => {
  it('should build a valid suggested resume in mock mode', async () => {
    const resume = createExampleStandardResume()
    const aiService = {
      getProviderSummary: () => ({
        provider: 'mock',
        model: 'mock-resume',
        mode: 'mock',
      }),
      generateText: vi.fn(),
    } as unknown as AiService
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue(null),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    const result = await service.generateSuggestion({
      instruction: '请针对 Next.js React TypeScript 岗位优化这份简历',
      locale: 'zh',
    })

    expect(result.resultId).toBeTruthy()
    expect(result.providerSummary.mode).toBe('mock')
    expect(result.summary.length).toBeGreaterThan(0)
    expect(result.focusAreas.length).toBeGreaterThan(0)
    expect(result.changedModules).toContain('profile')
    expect(result.moduleDiffs.length).toBeGreaterThan(0)
    expect(result.moduleDiffs[0]?.entries.length).toBeGreaterThan(0)
    expect(result.moduleDiffs[0]?.entries[0]?.suggestion).toBeTruthy()
    expect(result.moduleDiffs[0]?.entries[0]?.reason).toBeTruthy()
    expect(
      result.moduleDiffs.some((moduleDiff) =>
        moduleDiff.entries.some((entry) => entry.suggestedValue.includes('Next.js')),
      ),
    ).toBe(true)
  })

  it('should parse provider JSON and merge it into the current resume draft', async () => {
    const resume = createExampleStandardResume()
    const aiService = {
      getProviderSummary: () => ({
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      }),
      generateText: vi.fn().mockResolvedValue({
        provider: 'qiniu',
        model: 'deepseek-v3',
        text: JSON.stringify({
          summary: '已生成结构化建议',
          focusAreas: ['强化摘要', '补强项目亮点'],
          patch: {
            profile: {
              summary: {
                zh: '新的中文摘要',
                en: 'New English summary',
              },
            },
            projects: [
              {
                index: 0,
                summary: {
                  zh: '新的项目摘要',
                  en: 'New project summary',
                },
              },
            ],
          },
        }),
      }),
    } as unknown as AiService
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue(null),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    const result = await service.generateSuggestion({
      instruction: '请增强当前简历中与 React 和 Next.js 相关的表达',
      locale: 'zh',
    })

    expect(result.summary).toBe('已生成结构化建议')
    expect(result.focusAreas).toEqual(['强化摘要', '补强项目亮点'])
    expect(result.resultId).toBeTruthy()
    expect(result.moduleDiffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module: 'profile',
          entries: expect.arrayContaining([
            expect.objectContaining({
              label: '个人摘要',
              currentValue: expect.any(String),
              suggestion: expect.any(String),
              reason: expect.any(String),
              suggestedValue: expect.any(String),
            }),
          ]),
        }),
      ]),
    )
    const detail = await service.getSuggestionResult(result.resultId, 'zh')

    expect(detail.summary).toBe('已生成结构化建议')
    expect(detail.source).toBe('cache')
    expect(detail.canApply).toBe(true)
  })

  it('should reject invalid provider payloads', async () => {
    const resume = createExampleStandardResume()
    const aiService = {
      getProviderSummary: () => ({
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      }),
      generateText: vi.fn().mockResolvedValue({
        provider: 'qiniu',
        model: 'deepseek-v3',
        text: '{"summary": "", "focusAreas": [], "patch": {}}',
      }),
    } as unknown as AiService
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue(null),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    await expect(
      service.generateSuggestion({
        instruction: '请帮我优化简历',
        locale: 'zh',
      }),
    ).rejects.toThrow('AI 返回的 summary 无效')
  })

  it('should apply only the selected modules back to the current draft', async () => {
    const resume = createExampleStandardResume()
    const updateDraft = vi
      .fn()
      .mockImplementation(async (nextResume: StandardResume) => ({
        status: 'draft',
        resume: nextResume,
        updatedAt: '2026-03-31T00:00:00.000Z',
      }))
    const aiService = {
      getProviderSummary: () => ({
        provider: 'mock',
        model: 'mock-resume',
        mode: 'mock',
      }),
      generateText: vi.fn(),
    } as unknown as AiService
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
      updateDraft,
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue(null),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    const suggestion = await service.generateSuggestion({
      instruction: '请针对 Next.js React TypeScript 岗位优化这份简历',
      locale: 'zh',
    })

    await service.applySuggestion({
      resultId: suggestion.resultId,
      modules: ['profile'],
    })

    expect(updateDraft).toHaveBeenCalledTimes(1)
    const nextResume = updateDraft.mock.calls[0]?.[0] as StandardResume

    expect(nextResume.profile.summary.zh).toContain('Next.js')
    expect(nextResume.projects[0]?.summary.zh).toBe(resume.projects[0]?.summary.zh)
    expect(nextResume.highlights[0]?.description.zh).toBe(
      resume.highlights[0]?.description.zh,
    )
  })

  it('should reject apply when the draft timestamp is stale', async () => {
    const resume = createExampleStandardResume()
    const aiService = {
      getProviderSummary: () => ({
        provider: 'mock',
        model: 'mock-resume',
        mode: 'mock',
      }),
      generateText: vi.fn(),
    } as unknown as AiService
    const getDraft = vi
      .fn()
      .mockResolvedValueOnce({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      })
      .mockResolvedValueOnce({
        status: 'draft',
        resume,
        updatedAt: '2026-03-31T00:00:00.000Z',
      })
    const resumePublicationService = {
      getDraft,
      updateDraft: vi.fn(),
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue(null),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    const suggestion = await service.generateSuggestion({
      instruction: '请帮我优化简历',
      locale: 'zh',
    })

    await expect(
      service.applySuggestion({
        resultId: suggestion.resultId,
        modules: ['profile'],
      }),
    ).rejects.toThrow('当前草稿已发生变化，请重新生成建议稿后再应用')
  })

  it('should return persisted snapshot detail when cache misses', async () => {
    const resume = createExampleStandardResume()
    const aiService = {
      getProviderSummary: () => ({
        provider: 'mock',
        model: 'mock-resume',
        mode: 'mock',
      }),
      generateText: vi.fn(),
    } as unknown as AiService
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue({
        resultId: 'result-db-001',
        locale: 'zh',
        summary: '来自落库快照的优化摘要',
        focusAreas: ['突出项目成果'],
        changedModules: ['profile'],
        moduleDiffs: [
          {
            module: 'profile',
            title: '个人定位与摘要',
            reason: '个人摘要决定第一印象。',
            entries: [
              {
                key: 'profile-summary',
                label: '个人摘要',
                currentValue: '旧摘要',
                suggestedValue: '新摘要',
                suggestion: '建议改写摘要',
                reason: '更贴近岗位需求',
              },
            ],
          },
        ],
        createdAt: '2026-04-16T08:00:00.000Z',
        providerSummary: {
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'openai-compatible',
        },
        patch: {
          profile: {
            summary: {
              zh: '新摘要',
              en: 'New summary',
            },
          },
        },
        draftUpdatedAt: '2026-03-30T00:00:00.000Z',
      }),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    const detail = await service.getSuggestionResult('result-db-001', 'zh')

    expect(detail.summary).toBe('来自落库快照的优化摘要')
    expect(detail.source).toBe('usage-record')
    expect(detail.canApply).toBe(true)
    expect(detail.moduleDiffs).toHaveLength(1)
  })

  it('should apply persisted patch when cache misses', async () => {
    const resume = createExampleStandardResume()
    const updateDraft = vi
      .fn()
      .mockImplementation(async (nextResume: StandardResume) => ({
        status: 'draft',
        resume: nextResume,
        updatedAt: '2026-03-31T00:00:00.000Z',
      }))
    const aiService = {
      getProviderSummary: () => ({
        provider: 'mock',
        model: 'mock-resume',
        mode: 'mock',
      }),
      generateText: vi.fn(),
    } as unknown as AiService
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
      updateDraft,
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue({
        resultId: 'result-db-apply-001',
        locale: 'zh',
        summary: '落库建议',
        focusAreas: [],
        changedModules: ['profile'],
        moduleDiffs: [],
        createdAt: '2026-04-16T08:00:00.000Z',
        providerSummary: {
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'openai-compatible',
        },
        patch: {
          profile: {
            summary: {
              zh: '落库后的新摘要',
              en: 'Persisted summary',
            },
          },
        },
        draftUpdatedAt: '2026-03-30T00:00:00.000Z',
      }),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    await service.applySuggestion({
      resultId: 'result-db-apply-001',
      modules: ['profile'],
    })

    expect(updateDraft).toHaveBeenCalledTimes(1)
    const nextResume = updateDraft.mock.calls[0]?.[0] as StandardResume
    expect(nextResume.profile.summary.zh).toBe('落库后的新摘要')
  })

  it('should reject apply when persisted snapshot cannot be replayed', async () => {
    const resume = createExampleStandardResume()
    const aiService = {
      getProviderSummary: () => ({
        provider: 'mock',
        model: 'mock-resume',
        mode: 'mock',
      }),
      generateText: vi.fn(),
    } as unknown as AiService
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
      updateDraft: vi.fn(),
    } as unknown as ResumePublicationService
    const resultCacheService = new ResumeOptimizationResultCacheService()
    const aiUsageRecordService = {
      findResumeOptimizationSnapshotByResultId: vi.fn().mockResolvedValue({
        resultId: 'result-db-legacy-001',
        locale: 'zh',
        summary: '旧记录',
        focusAreas: [],
        changedModules: ['profile'],
        moduleDiffs: [],
        createdAt: '2026-04-16T08:00:00.000Z',
        providerSummary: {
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'openai-compatible',
        },
      }),
    }

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
      aiUsageRecordService as never,
    )

    await expect(
      service.applySuggestion({
        resultId: 'result-db-legacy-001',
        modules: ['profile'],
      }),
    ).rejects.toThrow('该历史记录不支持再次应用，请重新生成')
  })
})

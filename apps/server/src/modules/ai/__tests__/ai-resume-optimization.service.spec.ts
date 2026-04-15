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

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
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

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
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
    expect(service.getSuggestionResult(result.resultId, 'zh').summary).toBe('已生成结构化建议')
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

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
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

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
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

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
      resultCacheService,
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
})

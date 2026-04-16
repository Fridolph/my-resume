import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createApplyAiResumeOptimizationMethod,
  createFetchAiResumeOptimizationResultMethod,
  createFetchAiUsageHistoryMethod,
  createFetchAiUsageRecordDetailMethod,
  createFetchAiWorkbenchRuntimeMethod,
  createFetchCachedAiWorkbenchReportMethod,
  createFetchCachedAiWorkbenchReportsMethod,
  createGenerateAiResumeOptimizationMethod,
  createTriggerAiWorkbenchAnalysisMethod,
} from '../services/ai-workbench-api'

function createJsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('ai workbench api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch ai runtime summary with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'live',
          supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'],
        }),
      ),
    )

    const response = await createFetchAiWorkbenchRuntimeMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/runtime',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(response.provider).toBe('qiniu')
    expect(response.model).toBe('deepseek-v3')
    expect(response.supportedScenarios).toContain('jd-match')
  })

  it('should trigger live analysis with scenario, locale and content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          cached: false,
          usageRecordId: 'usage-report-001',
          report: {
            reportId: 'resume-review-demo',
            cacheKey: 'resume-review:zh:demo',
            scenario: 'resume-review',
            locale: 'zh',
            sourceHash: 'demo',
            inputPreview: 'NestJS React TypeScript',
            summary: '真实分析摘要',
            sections: [
              {
                key: 'analysis-result',
                title: '分析结果',
                bullets: ['建议补充量化成果。'],
              },
            ],
            generator: 'ai-provider',
            createdAt: '2026-03-27T00:00:00.000Z',
          },
        }),
      ),
    )

    const response = await createTriggerAiWorkbenchAnalysisMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      scenario: 'resume-review',
      locale: 'zh',
      content: 'NestJS React TypeScript',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/analyze',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-token',
        },
        body: JSON.stringify({
          scenario: 'resume-review',
          content: 'NestJS React TypeScript',
          locale: 'zh',
        }),
      }),
    )
    expect(response.usageRecordId).toBe('usage-report-001')
    expect(response.report.generator).toBe('ai-provider')
    expect(response.report.sections[0]?.title).toBe('分析结果')
  })

  it('should surface server analysis errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(500, {
          message: 'Provider request failed',
        }),
      ),
    )

    await expect(
      createTriggerAiWorkbenchAnalysisMethod({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        scenario: 'jd-match',
        locale: 'zh',
        content: 'NestJS React TypeScript',
      }),
    ).rejects.toThrow('Provider request failed')
  })

  it('should fetch cached report summaries for read-only viewer experience', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          reports: [
            {
              reportId: 'jd-match-demo',
              scenario: 'jd-match',
              locale: 'zh',
              summary: '缓存版 JD 匹配预览',
              generator: 'mock-cache',
              createdAt: '2026-03-27T00:00:00.000Z',
            },
          ],
        }),
      ),
    )

    const response = await createFetchCachedAiWorkbenchReportsMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'viewer-token',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/cache',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer viewer-token',
        }),
      }),
    )
    expect(response[0]?.reportId).toBe('jd-match-demo')
  })

  it('should fetch cached report detail by report id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          reportId: 'jd-match-demo',
          cacheKey: 'jd-match:zh:demo',
          scenario: 'jd-match',
          locale: 'zh',
          sourceHash: 'demo',
          inputPreview: 'NestJS React TypeScript',
          summary: '缓存版 JD 匹配预览',
          sections: [
            {
              key: 'match-overview',
              title: '匹配概览',
              bullets: ['当前输入已经覆盖 NestJS 与 React。'],
            },
          ],
          generator: 'mock-cache',
          createdAt: '2026-03-27T00:00:00.000Z',
        }),
      ),
    )

    const response = await createFetchCachedAiWorkbenchReportMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'viewer-token',
      reportId: 'jd-match-demo',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/cache/jd-match-demo',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer viewer-token',
        }),
      }),
    )
    expect(response.sections[0]?.title).toBe('匹配概览')
  })

  it('should request structured resume optimization with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          resultId: 'result-demo-001',
          usageRecordId: 'usage-optimize-001',
          locale: 'zh',
          summary: '已生成结构化建议',
          focusAreas: ['强化摘要', '补强项目亮点'],
          changedModules: ['profile', 'projects'],
          createdAt: '2026-03-30T00:00:00.000Z',
          moduleDiffs: [
            {
              module: 'profile',
              title: '个人定位与摘要',
              reason: '个人摘要决定面试官最先看到的岗位定位。',
              entries: [
                {
                  key: 'profile-summary',
                  label: '个人摘要',
                  currentValue: '原摘要',
                  suggestion: '建议将个人摘要改写得更贴近目标岗位。',
                  reason: '个人摘要决定招聘方第一眼如何判断岗位匹配度。',
                  suggestedValue: '新的中文摘要',
                },
              ],
            },
          ],
          providerSummary: {
            provider: 'qiniu',
            model: 'deepseek-v3',
            mode: 'openai-compatible',
          },
        }),
      ),
    )

    const response = await createGenerateAiResumeOptimizationMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      instruction: '请根据 React 和 Next.js 岗位优化当前简历',
      locale: 'zh',
      requestInit: {
        signal: new AbortController().signal,
      },
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/resume-optimize',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-token',
        },
        body: JSON.stringify({
          instruction: '请根据 React 和 Next.js 岗位优化当前简历',
          locale: 'zh',
        }),
      }),
    )
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/resume-optimize',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    )
    expect(response.resultId).toBe('result-demo-001')
    expect(response.usageRecordId).toBe('usage-optimize-001')
    expect(response.changedModules).toEqual(['profile', 'projects'])
    expect(response.moduleDiffs[0]?.entries[0]?.label).toBe('个人摘要')
    expect(response.moduleDiffs[0]?.entries[0]?.suggestion).toBe(
      '建议将个人摘要改写得更贴近目标岗位。',
    )
    expect(response.moduleDiffs[0]?.entries[0]?.reason).toBe(
      '个人摘要决定招聘方第一眼如何判断岗位匹配度。',
    )
    expect(response.moduleDiffs[0]?.entries[0]?.suggestedValue).toBe('新的中文摘要')
  })

  it('should fetch stored resume optimization result by result id and locale', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          resultId: 'result-demo-001',
          locale: 'zh',
          summary: '已生成结构化建议',
          focusAreas: ['强化摘要'],
          changedModules: ['profile'],
          createdAt: '2026-03-30T00:00:00.000Z',
          moduleDiffs: [],
          providerSummary: {
            provider: 'qiniu',
            model: 'deepseek-v3',
            mode: 'openai-compatible',
          },
        }),
      ),
    )

    const response = await createFetchAiResumeOptimizationResultMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      locale: 'zh',
      resultId: 'result-demo-001',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/resume-optimize/results/result-demo-001?locale=zh',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(response.resultId).toBe('result-demo-001')
    expect(response.locale).toBe('zh')
  })

  it('should fetch ai usage history with filter and limit query', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          records: [
            {
              id: 'usage-report-001',
              operationType: 'analysis-report',
              scenario: 'jd-match',
              locale: 'zh',
              inputPreview: 'NestJS React',
              summary: '匹配摘要',
              provider: 'qiniu',
              model: 'deepseek-v3',
              mode: 'openai-compatible',
              generator: 'ai-provider',
              status: 'succeeded',
              relatedReportId: 'report-001',
              relatedResultId: null,
              errorMessage: null,
              durationMs: 1800,
              createdAt: '2026-04-15T10:00:00.000Z',
              scoreLabel: '中等匹配',
              scoreValue: 78,
            },
          ],
        }),
      ),
    )

    const response = await createFetchAiUsageHistoryMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      type: 'analysis-report',
      limit: 20,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/history?limit=20&type=analysis-report',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(response[0]?.id).toBe('usage-report-001')
  })

  it('should fetch ai usage history detail by record id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          id: 'usage-report-001',
          operationType: 'analysis-report',
          scenario: 'jd-match',
          locale: 'zh',
          inputPreview: 'NestJS React',
          summary: '匹配摘要',
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'openai-compatible',
          generator: 'ai-provider',
          status: 'succeeded',
          relatedReportId: 'report-001',
          relatedResultId: null,
          errorMessage: null,
          durationMs: 1800,
          createdAt: '2026-04-15T10:00:00.000Z',
          detail: {
            reportId: 'report-001',
            summary: '匹配摘要',
          },
        }),
      ),
    )

    const response = await createFetchAiUsageRecordDetailMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      recordId: 'usage-report-001',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/history/usage-report-001',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(response.id).toBe('usage-report-001')
    expect(response.detail).toEqual({
      reportId: 'report-001',
      summary: '匹配摘要',
    })
  })

  it('should apply selected resume optimization modules with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          status: 'draft',
          updatedAt: '2026-03-31T00:00:00.000Z',
          resume: {
            meta: {
              slug: 'standard-resume',
              version: 1,
              defaultLocale: 'zh',
              locales: ['zh', 'en'],
            },
            profile: {
              fullName: {
                zh: '付寅生',
                en: 'Yinsheng Fu',
              },
              headline: {
                zh: '前端工程师',
                en: 'Frontend Engineer',
              },
              summary: {
                zh: '新的中文摘要',
                en: 'New English summary',
              },
              location: {
                zh: '成都',
                en: 'Chengdu',
              },
              email: 'demo@example.com',
              phone: '123456789',
              website: 'https://example.com',
              hero: {
                frontImageUrl: '/img/avatar.jpg',
                backImageUrl: '/img/avatar2.jpg',
                linkUrl: 'https://github.com/Fridolph/my-resume',
                slogans: [
                  {
                    zh: '热爱Coding，生命不息，折腾不止',
                    en: 'Driven by coding, always building, always iterating',
                  },
                  {
                    zh: '羽毛球爱好者，快乐挥拍，球场飞翔',
                    en: 'Badminton lover, happy swings, full-court energy',
                  },
                ],
              },
              links: [],
              interests: [],
            },
            education: [],
            experiences: [],
            projects: [],
            skills: [],
            highlights: [],
          },
        }),
      ),
    )

    const response = await createApplyAiResumeOptimizationMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      resultId: 'result-demo-001',
      modules: ['profile'],
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/resume-optimize/apply',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-token',
        },
        body: JSON.stringify({
          resultId: 'result-demo-001',
          modules: ['profile'],
        }),
      }),
    )
    expect(response.resume.profile.summary.zh).toBe('新的中文摘要')
  })
})

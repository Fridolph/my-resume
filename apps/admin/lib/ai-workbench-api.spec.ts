import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  applyAiResumeOptimization,
  fetchCachedAiWorkbenchReport,
  fetchCachedAiWorkbenchReports,
  fetchAiWorkbenchRuntime,
  generateAiResumeOptimization,
  triggerAiWorkbenchAnalysis,
} from './ai-workbench-api';

describe('ai workbench api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch ai runtime summary with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'live',
          supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'],
        }),
      }),
    );

    const response = await fetchAiWorkbenchRuntime({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/reports/runtime',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }),
    );
    expect(response.provider).toBe('qiniu');
    expect(response.model).toBe('deepseek-v3');
    expect(response.supportedScenarios).toContain('jd-match');
  });

  it('should trigger live analysis with scenario, locale and content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          cached: false,
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
      }),
    );

    const response = await triggerAiWorkbenchAnalysis({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      scenario: 'resume-review',
      locale: 'zh',
      content: 'NestJS React TypeScript',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/reports/analyze',
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
    );
    expect(response.report.generator).toBe('ai-provider');
    expect(response.report.sections[0]?.title).toBe('分析结果');
  });

  it('should surface server analysis errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          message: 'Provider request failed',
        }),
      }),
    );

    await expect(
      triggerAiWorkbenchAnalysis({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        scenario: 'jd-match',
        locale: 'zh',
        content: 'NestJS React TypeScript',
      }),
    ).rejects.toThrow('Provider request failed');
  });

  it('should fetch cached report summaries for read-only viewer experience', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
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
      }),
    );

    const response = await fetchCachedAiWorkbenchReports({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'viewer-token',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/reports/cache',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer viewer-token',
        },
      }),
    );
    expect(response[0]?.reportId).toBe('jd-match-demo');
  });

  it('should fetch cached report detail by report id', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
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
      }),
    );

    const response = await fetchCachedAiWorkbenchReport({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'viewer-token',
      reportId: 'jd-match-demo',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/reports/cache/jd-match-demo',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer viewer-token',
        },
      }),
    );
    expect(response.sections[0]?.title).toBe('匹配概览');
  });

  it('should request structured resume optimization with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          summary: '已生成结构化建议',
          focusAreas: ['强化摘要', '补强项目亮点'],
          changedModules: ['profile', 'projects'],
          moduleDiffs: [
            {
              module: 'profile',
              title: '个人定位与摘要',
              reason: '个人摘要决定面试官最先看到的岗位定位。',
              entries: [
                {
                  key: 'profile-summary',
                  label: '个人摘要',
                  before: '中文：原摘要 | English: Original summary',
                  after: '中文：新的中文摘要 | English: New English summary',
                },
              ],
            },
          ],
          applyPayload: {
            draftUpdatedAt: '2026-03-30T00:00:00.000Z',
            patch: {
              profile: {
                summary: {
                  zh: '新的中文摘要',
                  en: 'New English summary',
                },
              },
            },
          },
          suggestedResume: {
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
              links: [],
              interests: [],
            },
            education: [],
            experiences: [],
            projects: [],
            skills: [],
            highlights: [],
          },
          providerSummary: {
            provider: 'qiniu',
            model: 'deepseek-v3',
            mode: 'openai-compatible',
          },
        }),
      }),
    );

    const response = await generateAiResumeOptimization({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      instruction: '请根据 React 和 Next.js 岗位优化当前简历',
      locale: 'zh',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/reports/resume-optimize',
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
    );
    expect(response.changedModules).toEqual(['profile', 'projects']);
    expect(response.moduleDiffs[0]?.entries[0]?.label).toBe('个人摘要');
    expect(response.applyPayload.patch.profile?.summary?.zh).toBe('新的中文摘要');
    expect(response.suggestedResume.profile.summary.zh).toBe('新的中文摘要');
  });

  it('should apply selected resume optimization modules with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
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
      }),
    );

    const response = await applyAiResumeOptimization({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      draftUpdatedAt: '2026-03-30T00:00:00.000Z',
      modules: ['profile'],
      patch: {
        profile: {
          summary: {
            zh: '新的中文摘要',
            en: 'New English summary',
          },
        },
      },
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/ai/reports/resume-optimize/apply',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-token',
        },
        body: JSON.stringify({
          draftUpdatedAt: '2026-03-30T00:00:00.000Z',
          modules: ['profile'],
          patch: {
            profile: {
              summary: {
                zh: '新的中文摘要',
                en: 'New English summary',
              },
            },
          },
        }),
      }),
    );
    expect(response.resume.profile.summary.zh).toBe('新的中文摘要');
  });
});

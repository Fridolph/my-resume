import { describe, expect, it, vi } from 'vitest';

import { ResumePublicationService } from '../resume/resume-publication.service';
import { createExampleStandardResume } from '../resume/domain/standard-resume';
import { AiService } from './ai.service';
import { AiResumeOptimizationService } from './ai-resume-optimization.service';

describe('AiResumeOptimizationService', () => {
  it('should build a valid suggested resume in mock mode', async () => {
    const resume = createExampleStandardResume();
    const aiService = {
      getProviderSummary: () => ({
        provider: 'mock',
        model: 'mock-resume',
        mode: 'mock',
      }),
      generateText: vi.fn(),
    } as unknown as AiService;
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
    } as unknown as ResumePublicationService;

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
    );

    const result = await service.generateSuggestion({
      instruction: '请针对 Next.js React TypeScript 岗位优化这份简历',
      locale: 'zh',
    });

    expect(result.providerSummary.mode).toBe('mock');
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.focusAreas.length).toBeGreaterThan(0);
    expect(result.changedModules).toContain('profile');
    expect(result.suggestedResume.profile.summary.zh).toContain('Next.js');
  });

  it('should parse provider JSON and merge it into the current resume draft', async () => {
    const resume = createExampleStandardResume();
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
    } as unknown as AiService;
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
    } as unknown as ResumePublicationService;

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
    );

    const result = await service.generateSuggestion({
      instruction: '请增强当前简历中与 React 和 Next.js 相关的表达',
      locale: 'zh',
    });

    expect(result.summary).toBe('已生成结构化建议');
    expect(result.focusAreas).toEqual(['强化摘要', '补强项目亮点']);
    expect(result.suggestedResume.profile.summary.zh).toBe('新的中文摘要');
    expect(result.suggestedResume.projects[0]?.summary.zh).toBe('新的项目摘要');
    expect(result.suggestedResume.profile.email).toBe(resume.profile.email);
  });

  it('should reject invalid provider payloads', async () => {
    const resume = createExampleStandardResume();
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
    } as unknown as AiService;
    const resumePublicationService = {
      getDraft: vi.fn().mockResolvedValue({
        status: 'draft',
        resume,
        updatedAt: '2026-03-30T00:00:00.000Z',
      }),
    } as unknown as ResumePublicationService;

    const service = new AiResumeOptimizationService(
      aiService,
      resumePublicationService,
    );

    await expect(
      service.generateSuggestion({
        instruction: '请帮我优化简历',
        locale: 'zh',
      }),
    ).rejects.toThrow('AI 返回的 summary 无效');
  });
});

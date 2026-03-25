import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchPublishedResume } from './published-resume-api';

describe('published resume api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should return published snapshot when server responds successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'published',
          publishedAt: '2026-03-25T00:00:00.000Z',
          resume: {
            profile: {
              fullName: {
                zh: '付寅生',
                en: 'Yinsheng Fu',
              },
              headline: {
                zh: '全栈开发工程师',
                en: 'Full-Stack Engineer',
              },
              summary: {
                zh: '示例摘要',
                en: 'Example summary',
              },
              location: {
                zh: '上海',
                en: 'Shanghai',
              },
              email: 'demo@example.com',
              phone: '+86 13800000000',
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

    const result = await fetchPublishedResume({
      apiBaseUrl: 'http://localhost:3001',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3001/resume/published',
      expect.objectContaining({
        cache: 'no-store',
      }),
    );
    expect(result?.status).toBe('published');
    expect(result?.resume.profile.fullName.en).toBe('Yinsheng Fu');
  });

  it('should return null when no published resume exists yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }),
    );

    const result = await fetchPublishedResume({
      apiBaseUrl: 'http://localhost:3001',
    });

    expect(result).toBeNull();
  });
});

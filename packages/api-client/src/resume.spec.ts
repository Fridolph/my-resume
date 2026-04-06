import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildPublishedResumeExportUrl,
  fetchDraftResume,
  fetchPublishedResume,
  publishResume,
  type ResumeDraftSnapshot,
  updateDraftResume,
} from './resume';

const draftSnapshot: ResumeDraftSnapshot = {
  status: 'draft',
  updatedAt: '2026-03-26T04:00:00.000Z',
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
        zh: '全栈开发工程师',
        en: 'Full-Stack Engineer',
      },
      summary: {
        zh: '草稿摘要',
        en: 'Draft summary',
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
};

describe('api-client resume contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch the published resume and return null for 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({
            status: 'published',
            publishedAt: '2026-03-26T04:10:00.000Z',
            resume: draftSnapshot.resume,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
        }),
    );

    const published = await fetchPublishedResume({
      apiBaseUrl: 'http://localhost:5577/',
    });
    const missing = await fetchPublishedResume({
      apiBaseUrl: 'http://localhost:5577',
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5577/resume/published',
      expect.objectContaining({
        cache: 'no-store',
      }),
    );
    expect(published?.status).toBe('published');
    expect(missing).toBeNull();
  });

  it('should send bearer token when fetching and updating draft', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => draftSnapshot,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => draftSnapshot,
        }),
    );

    await fetchDraftResume({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    });

    await updateDraftResume({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      resume: draftSnapshot.resume,
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5577/resume/draft',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:5577/resume/draft',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          Authorization: 'Bearer demo-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftSnapshot.resume),
      }),
    );
  });

  it('should publish resume and build stable export url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 'published',
          publishedAt: '2026-03-26T04:20:00.000Z',
          resume: draftSnapshot.resume,
        }),
      }),
    );

    const result = await publishResume({
      apiBaseUrl: 'http://localhost:5577/',
      accessToken: 'demo-token',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/resume/publish',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }),
    );
    expect(result.status).toBe('published');
    expect(
      buildPublishedResumeExportUrl({
        apiBaseUrl: 'http://localhost:5577/',
        format: 'markdown',
        locale: 'en',
      }),
    ).toBe('http://localhost:5577/resume/published/export/markdown?locale=en');
  });

  it('should surface server-side error messages for draft and publish failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            statusCode: 503,
            message:
              '当前本地 SQLite 数据库正被其他进程占用，请关闭 DB Browser 等工具后重试。',
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            statusCode: 503,
            message: ['发布失败，请稍后重试', '请关闭外部数据库工具后重试'],
          }),
        }),
    );

    await expect(
      updateDraftResume({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        resume: draftSnapshot.resume,
      }),
    ).rejects.toThrow(
      '当前本地 SQLite 数据库正被其他进程占用，请关闭 DB Browser 等工具后重试。',
    );

    await expect(
      publishResume({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
      }),
    ).rejects.toThrow('发布失败，请稍后重试；请关闭外部数据库工具后重试');
  });
});

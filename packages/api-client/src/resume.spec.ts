import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildPublishedResumeExportUrl,
  createFetchDraftResumeMethod,
  createFetchDraftResumeSummaryMethod,
  createFetchPublishedResumeMethod,
  createFetchPublishedResumeSummaryMethod,
  createPublishResumeMethod,
  createUpdateDraftResumeMethod,
  type ResumeDraftSummarySnapshot,
  type ResumeDraftSnapshot,
} from './resume'

function createJsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

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
}

const draftSummarySnapshot: ResumeDraftSummarySnapshot = {
  status: 'draft',
  updatedAt: '2026-03-26T04:00:00.000Z',
  resume: {
    meta: {
      slug: 'standard-resume',
      defaultLocale: 'zh',
      locale: 'zh',
    },
    profile: {
      headline: '全栈开发工程师',
      summary: '草稿摘要',
    },
    counts: {
      education: 1,
      experiences: 2,
      projects: 3,
      skills: 4,
      highlights: 5,
    },
  },
}

describe('api-client resume contract', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch the published resume and return null for 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          createJsonResponse(200, {
            status: 'published',
            publishedAt: '2026-03-26T04:10:00.000Z',
            resume: draftSnapshot.resume,
          }),
        )
        .mockResolvedValueOnce(createJsonResponse(404, { message: 'Not Found' })),
    )

    const published = await createFetchPublishedResumeMethod({
      apiBaseUrl: 'http://localhost:5577/',
    })
    const missing = await createFetchPublishedResumeMethod({
      apiBaseUrl: 'http://localhost:5577',
    })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5577/api/resume/published',
      expect.objectContaining({
        cache: 'no-store',
      }),
    )
    expect(published?.status).toBe('published')
    expect(missing).toBeNull()
  })

  it('should fetch published summary and return null for 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          createJsonResponse(200, {
            status: 'published',
            publishedAt: '2026-03-26T04:10:00.000Z',
            resume: draftSummarySnapshot.resume,
          }),
        )
        .mockResolvedValueOnce(createJsonResponse(404, { message: 'Not Found' })),
    )

    const published = await createFetchPublishedResumeSummaryMethod({
      apiBaseUrl: 'http://localhost:5577/',
      locale: 'en',
    })
    const missing = await createFetchPublishedResumeSummaryMethod({
      apiBaseUrl: 'http://localhost:5577',
    })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5577/api/resume/published/summary?locale=en',
      expect.objectContaining({
        cache: 'no-store',
      }),
    )
    expect(published?.status).toBe('published')
    expect(missing).toBeNull()
  })

  it('should send bearer token when fetching and updating draft', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(createJsonResponse(200, draftSnapshot))
        .mockResolvedValueOnce(createJsonResponse(200, draftSummarySnapshot))
        .mockResolvedValueOnce(createJsonResponse(200, draftSnapshot)),
    )

    await createFetchDraftResumeMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    })

    await createFetchDraftResumeSummaryMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      locale: 'zh',
    })

    await createUpdateDraftResumeMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      resume: draftSnapshot.resume,
    })

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'http://localhost:5577/api/resume/draft',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'http://localhost:5577/api/resume/draft/summary?locale=zh',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(fetch).toHaveBeenNthCalledWith(
      3,
      'http://localhost:5577/api/resume/draft',
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(draftSnapshot.resume),
      }),
    )
  })

  it('should publish resume and build stable export url', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          status: 'published',
          publishedAt: '2026-03-26T04:20:00.000Z',
          resume: draftSnapshot.resume,
        }),
      ),
    )

    const result = await createPublishResumeMethod({
      apiBaseUrl: 'http://localhost:5577/',
      accessToken: 'demo-token',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/resume/publish',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(result.status).toBe('published')
    expect(
      buildPublishedResumeExportUrl({
        apiBaseUrl: 'http://localhost:5577/',
        format: 'markdown',
        locale: 'en',
      }),
    ).toBe('http://localhost:5577/api/resume/published/export/markdown?locale=en')
  })

  it('should surface server-side error messages for draft and publish failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          createJsonResponse(503, {
            statusCode: 503,
            message:
              '当前本地 SQLite 数据库正被其他进程占用，请关闭 DB Browser 等工具后重试。',
          }),
        )
        .mockResolvedValueOnce(
          createJsonResponse(503, {
            statusCode: 503,
            message: ['发布失败，请稍后重试', '请关闭外部数据库工具后重试'],
          }),
        ),
    )

    await expect(
      createUpdateDraftResumeMethod({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        resume: draftSnapshot.resume,
      }),
    ).rejects.toThrow(
      '当前本地 SQLite 数据库正被其他进程占用，请关闭 DB Browser 等工具后重试。',
    )

    await expect(
      createPublishResumeMethod({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
      }),
    ).rejects.toThrow('发布失败，请稍后重试；请关闭外部数据库工具后重试')
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFetchPublishedResumeMethod } from '../services/published-resume-api'

function createJsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('published resume api', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should return published snapshot when server responds successfully', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          status: 'published',
          publishedAt: '2026-03-25T00:00:00.000Z',
          resume: {
            meta: {
              slug: 'standard-resume' as const,
              version: 1 as const,
              defaultLocale: 'zh' as const,
              locales: ['zh', 'en'] as const,
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

    const result = await createFetchPublishedResumeMethod({
      apiBaseUrl: 'http://localhost:5577',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/resume/published',
      expect.objectContaining({
        cache: 'no-store',
      }),
    )
    expect(result?.status).toBe('published')
    expect(result?.resume.profile.fullName.en).toBe('Yinsheng Fu')
  })

  it('should return null when no published resume exists yet', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    )

    const result = await createFetchPublishedResumeMethod({
      apiBaseUrl: 'http://localhost:5577',
    })

    expect(result).toBeNull()
  })
})

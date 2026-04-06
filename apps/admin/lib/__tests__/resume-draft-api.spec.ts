import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchDraftResume, updateDraftResume } from '../resume-draft-api';
import type { ResumeDraftSnapshot } from '../resume-types';

const draftSnapshot: ResumeDraftSnapshot = {
  status: 'draft' as const,
  updatedAt: '2026-03-25T09:20:00.000Z',
  resume: {
    meta: {
      slug: 'standard-resume' as const,
      version: 1 as const,
      defaultLocale: 'zh' as const,
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
};

describe('resume draft api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch draft resume with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => draftSnapshot,
      }),
    );

    const response = await fetchDraftResume({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    });

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/resume/draft',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer demo-token',
        },
      }),
    );
    expect(response.resume.profile.fullName.zh).toBe('付寅生');
  });

  it('should save draft resume with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => draftSnapshot,
      }),
    );

    const response = await updateDraftResume({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      resume: draftSnapshot.resume,
    });

    expect(fetch).toHaveBeenCalledWith(
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
    expect(response.status).toBe('draft');
  });
});

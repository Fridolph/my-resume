import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { PublishedResumeShell } from './published-resume-shell';

const publishedResume = {
  status: 'published' as const,
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
        zh: '专注前端工程化与 Node.js 后端。',
        en: 'Focused on frontend engineering and Node.js backend development.',
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
    projects: [
      {
        name: {
          zh: '个人简历 Monorepo',
          en: 'Personal Resume Monorepo',
        },
        role: {
          zh: '作者',
          en: 'Author',
        },
        startDate: '2026-03',
        endDate: '进行中',
        summary: {
          zh: '逐步构建三端项目。',
          en: 'Incrementally building a three-surface project.',
        },
        highlights: [],
        technologies: ['Next.js', 'NestJS'],
        links: [],
      },
    ],
    skills: [
      {
        name: {
          zh: '前端工程化',
          en: 'Frontend Engineering',
        },
        keywords: ['TypeScript', 'React'],
      },
    ],
    highlights: [],
  },
};

describe('PublishedResumeShell', () => {
  it('should render zh content by default and switch to en', async () => {
    const user = userEvent.setup();

    render(<PublishedResumeShell publishedResume={publishedResume} />);

    expect(screen.getByRole('heading', { name: '付寅生' })).toBeInTheDocument();
    expect(
      screen.getByText('专注前端工程化与 Node.js 后端。'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(
      screen.getByRole('heading', { name: 'Yinsheng Fu' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Focused on frontend engineering and Node.js backend development.'),
    ).toBeInTheDocument();
  });

  it('should toggle light and dark theme on the document element', async () => {
    const user = userEvent.setup();

    render(<PublishedResumeShell publishedResume={publishedResume} />);

    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('should render empty state when no published content is available', () => {
    render(<PublishedResumeShell publishedResume={null} />);

    expect(
      screen.getByText('当前还没有已发布的公开简历内容。'),
    ).toBeInTheDocument();
  });
});

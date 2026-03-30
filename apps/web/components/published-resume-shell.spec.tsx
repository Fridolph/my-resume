import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeModeProvider } from '@my-resume/ui/theme';
import { describe, expect, it } from 'vitest';

import type { ResumePublishedSnapshot } from '../lib/published-resume-types';
import { PublishedResumeShell } from './published-resume-shell';

const publishedResume: ResumePublishedSnapshot = {
  status: 'published' as const,
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
    projects: [
      {
        name: {
          zh: 'my-resume 在线简历',
          en: 'my-resume Online Resume',
        },
        role: {
          zh: '作者 / 维护者',
          en: 'Author / Maintainer',
        },
        startDate: '2024-02',
        endDate: '至今',
        summary: {
          zh: '使用 Vite、Vue3、TypeScript 与 TailwindCSS 搭建的在线简历项目。',
          en: 'An online resume project built with Vite, Vue 3, TypeScript, and Tailwind CSS.',
        },
        highlights: [
          {
            zh: '持续以教程和开源形式迭代。',
            en: 'Iterated publicly through tutorials and open source.',
          },
        ],
        technologies: ['Next.js', 'NestJS'],
        links: [],
      },
    ],
    education: [
      {
        schoolName: {
          zh: '四川大学锦江学院',
          en: 'Sichuan University Jinjiang College',
        },
        degree: {
          zh: '本科',
          en: 'Bachelor',
        },
        fieldOfStudy: {
          zh: '通信工程',
          en: 'Communication Engineering',
        },
        startDate: '2012-09',
        endDate: '2016-06',
        location: {
          zh: '四川 眉山',
          en: 'Meishan, Sichuan',
        },
        highlights: [],
      },
    ],
    experiences: [
      {
        companyName: {
          zh: '成都一蟹科技有限公司',
          en: 'Chengdu Yixie Technology Co., Ltd.',
        },
        role: {
          zh: '前端主管',
          en: 'Frontend Lead',
        },
        employmentType: {
          zh: '全职',
          en: 'Full-time',
        },
        startDate: '2024-03',
        endDate: '2024-08',
        location: {
          zh: '成都',
          en: 'Chengdu',
        },
        summary: {
          zh: '负责需求规划、团队协作、技术升级与质量建设。',
          en: 'Led requirement planning, team collaboration, technical upgrades, and quality practices.',
        },
        highlights: [
          {
            zh: '定期组织 Code Review 和技术分享。',
            en: 'Organized regular code reviews and technical sharing sessions.',
          },
        ],
        technologies: ['Vue 3', 'TypeScript'],
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
    highlights: [
      {
        title: {
          zh: '开源参与',
          en: 'Open Source Contributions',
        },
        description: {
          zh: '持续沉淀文章、开源和知识文档。',
          en: 'Continuously shares articles, open-source work, and knowledge docs.',
        },
      },
    ],
  },
};

describe('PublishedResumeShell', () => {
  function renderShell() {
    return render(
      <ThemeModeProvider>
        <PublishedResumeShell publishedResume={publishedResume} />
      </ThemeModeProvider>,
    );
  }

  it(
    'should render modular zh sections by default and switch to en',
    async () => {
      const user = userEvent.setup();

      renderShell();

      expect(screen.getByRole('heading', { name: '付寅生' })).toBeInTheDocument();
      expect(
        screen.getByText('专注前端工程化与 Node.js 后端。'),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '职业经历' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '代表项目' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '教育背景' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '技能结构' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '补充亮点' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '公开简历速览' })).toBeInTheDocument();
      expect(screen.getByText('标准双语公开版')).toBeInTheDocument();
      expect(screen.getByText('成都一蟹科技有限公司')).toBeInTheDocument();
      expect(screen.getByText('四川大学锦江学院')).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'EN' }));

      expect(
        screen.getByRole('heading', { name: 'Yinsheng Fu' }),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Focused on frontend engineering and Node.js backend development.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Work Experience' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Selected Projects' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Education' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Skill Structure' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Additional Highlights' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Public Resume Overview' })).toBeInTheDocument();
      expect(screen.getByText('Standard Bilingual Edition')).toBeInTheDocument();
    },
    10000,
  );

  it('should toggle light and dark theme on the document element', async () => {
    const user = userEvent.setup();

    renderShell();

    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('button', { name: 'Dark' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Light' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('light');
  });

  it('should render export links and switch locale in download urls', async () => {
    const user = userEvent.setup();

    render(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          publishedResume={publishedResume}
        />
      </ThemeModeProvider>,
    );

    expect(
      screen.getByRole('link', { name: '导出 Markdown' }),
    ).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/markdown?locale=zh',
    );
    expect(screen.getByRole('link', { name: '导出 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/pdf?locale=zh',
    );

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(
      screen.getByRole('link', { name: 'Export Markdown' }),
    ).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/markdown?locale=en',
    );
    expect(screen.getByRole('link', { name: 'Export PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/pdf?locale=en',
    );
  });

  it('should render empty state when no published content is available', () => {
    render(
      <ThemeModeProvider>
        <PublishedResumeShell publishedResume={null} />
      </ThemeModeProvider>,
    );

    expect(
      screen.getByText('当前还没有已发布的公开简历内容。'),
    ).toBeInTheDocument();
  });
});

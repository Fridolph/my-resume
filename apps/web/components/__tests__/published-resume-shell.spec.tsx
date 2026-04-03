import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeModeProvider } from '@my-resume/ui/theme';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

import { PublishedResumeShell } from '../published-resume-shell';
import { publishedResumeFixture } from './resume-published-fixture';

describe('PublishedResumeShell', () => {
  function renderShell() {
    return render(
      <ThemeModeProvider>
        <PublishedResumeShell publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    );
  }

  it('should render direct resume reading flow on home and switch locale', async () => {
    const user = userEvent.setup();

    renderShell();

    expect(screen.getByRole('link', { name: '简历' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '履历概览' })).toHaveAttribute(
      'href',
      '/profile',
    );
    expect(screen.getByRole('link', { name: 'AI Talk' })).toHaveAttribute(
      'href',
      '/ai-talk',
    );
    expect(screen.getByRole('heading', { name: '付寅生' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '职业经历' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '代表项目' })).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: '公开简历速览' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '打开项目 GitHub 仓库' }).closest('a'),
    ).toHaveAttribute('href', 'https://github.com/Fridolph/my-resume');

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(
      screen.getByRole('heading', { name: 'Yinsheng Fu' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Profile' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open project GitHub repository' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Work Experience' }),
    ).toBeInTheDocument();
  });

  it('should toggle light and dark theme on the document element', async () => {
    const user = userEvent.setup();

    renderShell();

    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(screen.getByRole('switch', { name: '切换明暗主题' }));
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('dark');

    await user.click(screen.getByRole('switch', { name: '切换明暗主题' }));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('light');
  });

  it('should render export links and switch locale in download urls', async () => {
    const user = userEvent.setup();

    render(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    );

    expect(
      screen.getByRole('button', { name: '导出 Markdown' }).closest('a'),
    ).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/markdown?locale=zh',
    );
    expect(
      screen.getByRole('button', { name: '导出 PDF' }).closest('a'),
    ).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/pdf?locale=zh',
    );

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(
      screen.getByRole('button', { name: 'Export Markdown' }).closest('a'),
    ).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/markdown?locale=en',
    );
    expect(
      screen.getByRole('button', { name: 'Export PDF' }).closest('a'),
    ).toHaveAttribute(
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

import { render, screen } from '@testing-library/react';
import { ThemeModeProvider } from '@my-resume/ui/theme';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/profile',
}));

import { ProfileOverviewShell } from '../profile-overview-shell';
import { publishedResumeFixture } from './resume-published-fixture';

describe('ProfileOverviewShell', () => {
  it('should render profile overview cards and ai-talk entry', () => {
    render(
      <ThemeModeProvider>
        <ProfileOverviewShell publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    );

    expect(screen.getByRole('heading', { name: '公开履历概览' })).toBeInTheDocument();
    expect(screen.getByText('职业经历')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '进入 AI Talk' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'AI Talk' })).toHaveAttribute(
      'href',
      '/ai-talk',
    );
  });
});

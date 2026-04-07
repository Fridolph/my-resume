import { render, screen } from '@testing-library/react';
import { ThemeModeProvider } from '@my-resume/ui/theme';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ai-talk',
}));

import { AiTalkPlaceholderShell } from '../placeholder-shell';
import { publishedResumeFixture } from '../../published-resume/__tests__/fixture';

describe('AiTalkPlaceholderShell', () => {
  it('should render placeholder copy for the future rag entry', () => {
    render(
      <ThemeModeProvider>
        <AiTalkPlaceholderShell
          apiBaseUrl="http://localhost:5577"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    );

    expect(screen.getByRole('heading', { name: 'AI Talk 占位入口' })).toBeInTheDocument();
    expect(screen.getByText('即将接入 RAG')).toBeInTheDocument();
    expect(screen.getByText('他最近几年主要做过哪些项目？')).toBeInTheDocument();
  });
});

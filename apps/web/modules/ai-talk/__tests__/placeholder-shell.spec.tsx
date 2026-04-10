import { render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: any) => (
    <a
      href={
        typeof href === 'string'
          ? href === '/'
            ? '/zh'
            : href.startsWith('/')
              ? `/zh${href}`
              : href
          : '/zh'
      }
      {...props}>
      {children}
    </a>
  ),
  usePathname: () => '/ai-talk',
  useRouter: () => ({
    replace: vi.fn(),
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string => {
      const map: Record<string, string> = {
        aiTalkNav: 'AI Talk',
        brandName: 'Fridolph Resume',
        langEn: 'EN',
        langZh: '中',
        profileNav: '概览',
        resumeNav: '简历',
      }

      return map[key] ?? key
    },
}))

import { AiTalkPlaceholderShell } from '../placeholder-shell'
import { publishedResumeFixture } from '../../published-resume/__tests__/fixture'

describe('AiTalkPlaceholderShell', () => {
  it('should render placeholder copy for the future rag entry', () => {
    render(
      <ThemeModeProvider>
        <AiTalkPlaceholderShell
          apiBaseUrl="http://localhost:5577"
          locale="zh"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'AI Talk 占位入口' })).toBeInTheDocument()
    expect(screen.getByText('即将接入 RAG')).toBeInTheDocument()
    expect(screen.getByText('他最近几年主要做过哪些项目？')).toBeInTheDocument()
  })
})

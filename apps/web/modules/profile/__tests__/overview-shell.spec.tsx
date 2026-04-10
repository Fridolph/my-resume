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
  usePathname: () => '/profile',
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

import { ProfileOverviewShell } from '../overview-shell'
import { publishedResumeFixture } from '../../published-resume/__tests__/fixture'

describe('ProfileOverviewShell', () => {
  it('should render profile overview cards and ai-talk entry', () => {
    render(
      <ThemeModeProvider>
        <ProfileOverviewShell locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: '公开履历概览' })).toBeInTheDocument()
    expect(screen.getByText('职业经历')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '进入 AI Talk' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'AI Talk' })).toHaveAttribute(
      'href',
      '/zh/ai-talk',
    )
  })
})

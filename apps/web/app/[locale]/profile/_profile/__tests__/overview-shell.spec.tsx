import { render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@core/i18n/navigation', () => ({
  Link: ({ children, href, prefetch: _prefetch, ...props }: any) => (
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

vi.mock('next-intl', async () => {
  const zhSite = (await import('@shared/site/i18n/zh.json')).default
  const zhProfile = (await import('../i18n/zh.json')).default

  const bundles: Record<string, Record<string, unknown>> = {
    profile: zhProfile as Record<string, unknown>,
    site: zhSite as Record<string, unknown>,
  }

  const getMessage = (namespace: string, key: string): string => {
    const value = key
      .split('.')
      .reduce<unknown>((currentValue, segment) => {
        if (!currentValue || typeof currentValue !== 'object') {
          return undefined
        }

        return (currentValue as Record<string, unknown>)[segment]
      }, bundles[namespace])

    return typeof value === 'string' ? value : key
  }

  const interpolate = (message: string, values?: Record<string, unknown>) =>
    Object.entries(values ?? {}).reduce(
      (currentMessage, [name, value]) =>
        currentMessage.replaceAll(`{${name}}`, String(value)),
      message,
    )

  return {
    useTranslations:
      (namespace: string) =>
      (key: string, values?: Record<string, unknown>): string =>
        interpolate(getMessage(namespace, key), values),
  }
})

import { ProfileOverviewShell } from '../overview-shell'
import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

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

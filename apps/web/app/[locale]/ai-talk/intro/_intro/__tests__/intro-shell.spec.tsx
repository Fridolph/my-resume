import { render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@i18n/navigation', () => ({
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
  usePathname: () => '/ai-talk/intro',
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
    replace: vi.fn(),
  }),
}))

vi.mock('next-intl', async () => {
  const zhAiTalk = (await import('@i18n/locales/zh/aiTalk.json')).default
  const zhSite = (await import('@i18n/locales/zh/site.json')).default

  const bundles: Record<string, Record<string, unknown>> = {
    aiTalk: zhAiTalk as Record<string, unknown>,
    site: zhSite as Record<string, unknown>,
  }

  const getMessage = (namespace: string, key: string, values?: Record<string, string>): string => {
    const value = key
      .split('.')
      .reduce<unknown>((currentValue, segment) => {
        if (!currentValue || typeof currentValue !== 'object') {
          return undefined
        }

        return (currentValue as Record<string, unknown>)[segment]
      }, bundles[namespace])

    if (typeof value !== 'string') return key

    return Object.entries(values ?? {}).reduce(
      (message, [name, replacement]) => message.replace(`{${name}}`, replacement),
      value,
    )
  }

  return {
    useTranslations:
      (namespace: string) =>
      (key: string, values?: Record<string, string>): string =>
        getMessage(namespace, key, values),
  }
})

import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

import { AiTalkIntroShell } from '../intro-shell'

describe('AiTalkIntroShell', () => {
  it('should render the guided intro two-column shell and locked topic grid', () => {
    render(
      <ThemeModeProvider>
        <AiTalkIntroShell locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByTestId('ai-talk-intro-shell')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /AI Intro/ })).toBeInTheDocument()
    expect(screen.getByText('引导式问题')).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-intro-thread-preview')).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-intro-unlock-grid').children).toHaveLength(10)
    expect(screen.getByText('最近项目')).toBeInTheDocument()
    expect(screen.getByText('兴趣爱好')).toBeInTheDocument()
  })
})

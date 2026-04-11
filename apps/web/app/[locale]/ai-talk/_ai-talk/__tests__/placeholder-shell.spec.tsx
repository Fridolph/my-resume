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
  usePathname: () => '/ai-talk',
  useRouter: () => ({
    replace: vi.fn(),
  }),
}))

vi.mock('next-intl', async () => {
  const zhAiTalk = (await import('../i18n/zh.json')).default
  const zhSite = (await import('@shared/site/i18n/zh.json')).default

  const bundles: Record<string, Record<string, unknown>> = {
    aiTalk: zhAiTalk as Record<string, unknown>,
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

import { AiTalkPlaceholderShell } from '../placeholder-shell'
import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

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

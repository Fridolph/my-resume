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
  usePathname: () => '/ai-talk/sessions/demo-session',
  useRouter: () => ({
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

  const getMessage = (namespace: string, key: string, values?: Record<string, unknown>): string => {
    const value = key
      .split('.')
      .reduce<unknown>((currentValue, segment) => {
        if (!currentValue || typeof currentValue !== 'object') {
          return undefined
        }

        return (currentValue as Record<string, unknown>)[segment]
      }, bundles[namespace])

    const message = typeof value === 'string' ? value : key

    return Object.entries(values ?? {}).reduce(
      (currentMessage, [name, value]) =>
        currentMessage.replaceAll(`{${name}}`, String(value)),
      message,
    )
  }

  return {
    useTranslations:
      (namespace: string) =>
      (key: string, values?: Record<string, unknown>): string =>
        getMessage(namespace, key, values),
  }
})

import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

import { AiTalkSessionShell } from '../session-shell'

describe('AiTalkSessionShell', () => {
  it('should render the future session workspace placeholder', () => {
    render(
      <ThemeModeProvider>
        <AiTalkSessionShell
          locale="zh"
          publishedResume={publishedResumeFixture}
          sessionId="demo-session"
        />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: '会话工作区 · demo-session' })).toBeInTheDocument()
    expect(screen.getAllByText('来源片段')).not.toHaveLength(0)
    expect(screen.getByText('返回 RAG 对话')).toBeInTheDocument()
  })
})

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let activeLocale: 'zh' | 'en' = 'zh'
let pathnameState = '/zh/ai-talk/chat'
const pushMock = vi.fn()
const prefetchMock = vi.fn()

vi.mock('@i18n/navigation', () => ({
  Link: ({ children, href, prefetch: _prefetch, ...props }: any) => (
    <a
      href={
        typeof href === 'string'
          ? href === '/'
            ? `/${activeLocale}`
            : href.startsWith('/')
              ? `/${activeLocale}${href}`
              : href
          : `/${activeLocale}`
      }
      {...props}>
      {children}
    </a>
  ),
  usePathname: () => pathnameState,
  useRouter: () => ({
    push: pushMock,
    prefetch: prefetchMock,
    replace: vi.fn(),
  }),
}))

vi.mock('next-intl', async () => {
  const zhAiTalk = (await import('@i18n/locales/zh/aiTalk.json')).default
  const zhSite = (await import('@i18n/locales/zh/site.json')).default
  const enAiTalk = (await import('@i18n/locales/en/aiTalk.json')).default
  const enSite = (await import('@i18n/locales/en/site.json')).default

  const bundlesByLocale: Record<'zh' | 'en', Record<string, Record<string, unknown>>> = {
    zh: {
      aiTalk: zhAiTalk as Record<string, unknown>,
      site: zhSite as Record<string, unknown>,
    },
    en: {
      aiTalk: enAiTalk as Record<string, unknown>,
      site: enSite as Record<string, unknown>,
    },
  }

  const getMessage = (namespace: string, key: string): string => {
    const value = key
      .split('.')
      .reduce<unknown>((currentValue, segment) => {
        if (!currentValue || typeof currentValue !== 'object') {
          return undefined
        }

        return (currentValue as Record<string, unknown>)[segment]
      }, bundlesByLocale[activeLocale][namespace])

    return typeof value === 'string' ? value : key
  }

  return {
    useTranslations:
      (namespace: string) =>
      (key: string): string =>
        getMessage(namespace, key),
  }
})

import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

import { AiTalkChatEntryShell } from '../chat-entry-shell'

describe('AiTalkChatEntryShell', () => {
  beforeEach(() => {
    activeLocale = 'zh'
    pathnameState = '/zh/ai-talk/chat'
    pushMock.mockReset()
    prefetchMock.mockReset()
    cleanup()
  })

  it('should render the future rag chat workspace entry', () => {
    render(
      <ThemeModeProvider>
        <AiTalkChatEntryShell locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'RAG 对话入口' })).toBeInTheDocument()
    expect(screen.getByText('试用码')).toBeInTheDocument()
    expect(screen.getByText('10 轮问答')).toBeInTheDocument()
    expect(screen.getByText('流式响应')).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-chat-chip-row')).toHaveClass('flex-nowrap')
    expect(screen.getByTestId('ai-talk-chat-cta-row')).toHaveClass('justify-end')
    expect(screen.getByText('查看未来会话工作区')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '查看未来会话工作区' }))
    expect(pushMock).toHaveBeenCalledWith('/ai-talk/sessions/demo-session')
    fireEvent.click(screen.getByRole('button', { name: '返回 AI Talk 中枢' }))
    expect(pushMock).toHaveBeenCalledWith('/ai-talk')
    expect(prefetchMock).toHaveBeenCalledWith('/ai-talk/sessions/demo-session')
    expect(prefetchMock).toHaveBeenCalledWith('/ai-talk')
  })

  it('should render english static copy on en locale', () => {
    activeLocale = 'en'
    pathnameState = '/en/ai-talk/chat'

    render(
      <ThemeModeProvider>
        <AiTalkChatEntryShell locale="en" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'RAG Chat Entry' })).toBeInTheDocument()
    expect(screen.getByText('Trial code')).toBeInTheDocument()
    expect(screen.getByText('10-turn quota')).toBeInTheDocument()
    expect(screen.getByText('Streaming response')).toBeInTheDocument()
    expect(screen.getByText('Preview the future session workspace')).toBeInTheDocument()
  })
})

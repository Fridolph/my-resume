import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const pushMock = vi.fn()
const prefetchMock = vi.fn()

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
  usePathname: () => '/ai-talk/resume-advisor',
  useRouter: () => ({
    push: pushMock,
    prefetch: prefetchMock,
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

  return {
    useTranslations:
      (namespace: string) =>
      (key: string): string =>
        getMessage(namespace, key),
  }
})

import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

import { AiTalkResumeAdvisorShell } from '../resume-advisor-shell'

describe('AiTalkResumeAdvisorShell', () => {
  beforeEach(() => {
    pushMock.mockReset()
    prefetchMock.mockReset()
  })

  it('should render chip-style badges and stronger rag cta', () => {
    render(
      <ThemeModeProvider>
        <AiTalkResumeAdvisorShell locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: '简历优化与建议' })).toBeInTheDocument()
    expect(screen.getByTestId('resume-advisor-chip-primary')).toHaveTextContent('结构化基线')
    expect(screen.getByTestId('resume-advisor-chip-secondary')).toHaveTextContent('admin 工作台')

    const ragButton = screen.getByRole('button', { name: '进入 RAG 对话' })
    expect(ragButton.className).toContain('border')

    fireEvent.click(screen.getByRole('button', { name: '返回 AI Talk 中枢' }))
    fireEvent.click(ragButton)

    expect(prefetchMock).toHaveBeenCalledWith('/ai-talk')
    expect(prefetchMock).toHaveBeenCalledWith('/ai-talk/chat')
    expect(pushMock).toHaveBeenCalledWith('/ai-talk')
    expect(pushMock).toHaveBeenCalledWith('/ai-talk/chat')
  })
})

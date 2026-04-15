import { fireEvent, render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { describe, expect, it, vi } from 'vitest'

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
  usePathname: () => '/ai-talk/avatar',
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

import { AiTalkAvatarShell } from '../avatar-shell'

describe('AiTalkAvatarShell', () => {
  it('should render the avatar introduction placeholder and contract cards', () => {
    pushMock.mockReset()
    prefetchMock.mockReset()

    render(
      <ThemeModeProvider>
        <AiTalkAvatarShell locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: '数字人自我介绍' })).toBeInTheDocument()
    expect(screen.getByText('媒体资源')).toBeInTheDocument()
    const backButton = screen.getByRole('button', { name: '返回 AI Talk 中枢' })
    expect(backButton).toBeInTheDocument()
    fireEvent.click(backButton)
    expect(prefetchMock).toHaveBeenCalledWith('/ai-talk')
    expect(pushMock).toHaveBeenCalledWith('/ai-talk')
  })
})

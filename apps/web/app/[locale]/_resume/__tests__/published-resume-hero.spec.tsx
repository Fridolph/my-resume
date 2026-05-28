import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const openDrawerMock = vi.fn()
const emitGlobalAiChatOpenMock = vi.fn()

vi.mock('next-intl', async () => {
  const zhPublishedResume = (await import('@i18n/locales/zh/publishedResume.json')).default
  const zhSite = (await import('@i18n/locales/zh/site.json')).default

  const bundles: Record<string, Record<string, unknown>> = {
    publishedResume: zhPublishedResume as Record<string, unknown>,
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

vi.mock('@i18n/navigation', () => ({
  Link: ({ children, href, ...props }: any) => (
    <a
      href={
        typeof href === 'string'
          ? href.startsWith('/')
            ? `/zh${href}`
            : href
          : '/zh'
      }
      {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@shared/ai-chat/ai-chat-context', () => ({
  emitGlobalAiChatOpen: () => emitGlobalAiChatOpenMock(),
  useOptionalAiChat: () => ({
    openDrawer: openDrawerMock,
  }),
}))

vi.mock('../published-resume-profile-icon', () => ({
  PublishedResumeProfileIcon: ({ name }: { name: string }) => (
    <span data-testid="mock-profile-icon">{name}</span>
  ),
}))

import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'
import { PublishedResumeHero } from '../published-resume-hero'

describe('PublishedResumeHero', () => {
  beforeEach(() => {
    openDrawerMock.mockReset()
    emitGlobalAiChatOpenMock.mockReset()
  })

  it('should open AI chat drawer from avatar trigger', async () => {
    const user = userEvent.setup()

    render(
      <ThemeModeProvider>
        <PublishedResumeHero locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByText('talk with me ...')).toBeInTheDocument()

    const trigger = screen.getByRole('link', { name: '打开 AI 对话抽屉' })
    expect(trigger).toHaveAttribute('href', '/zh/ai-talk')

    await user.click(trigger)

    expect(openDrawerMock).toHaveBeenCalledTimes(1)
    expect(emitGlobalAiChatOpenMock).not.toHaveBeenCalled()
  })
})

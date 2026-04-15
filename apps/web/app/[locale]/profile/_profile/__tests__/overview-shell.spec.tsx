import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let activeLocale: 'zh' | 'en' = 'zh'
let pathnameState = '/zh/profile'
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
  const zhProfile = (await import('@i18n/locales/zh/profile.json')).default
  const zhSite = (await import('@i18n/locales/zh/site.json')).default
  const enProfile = (await import('@i18n/locales/en/profile.json')).default
  const enSite = (await import('@i18n/locales/en/site.json')).default

  const bundlesByLocale: Record<'zh' | 'en', Record<string, Record<string, unknown>>> = {
    zh: {
      profile: zhProfile as Record<string, unknown>,
      site: zhSite as Record<string, unknown>,
    },
    en: {
      profile: enProfile as Record<string, unknown>,
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
  beforeEach(() => {
    activeLocale = 'zh'
    pathnameState = '/zh/profile'
    pushMock.mockReset()
    prefetchMock.mockReset()
    cleanup()
  })

  it('should render profile overview cards and ai-talk entry', () => {
    render(
      <ThemeModeProvider>
        <ProfileOverviewShell locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: '公开履历概览' })).toBeInTheDocument()
    expect(screen.getByText('职业经历')).toBeInTheDocument()
    const aiTalkButton = screen.getByRole('button', { name: '进入 AI Talk' })
    expect(aiTalkButton).toBeInTheDocument()
    expect(aiTalkButton.className).toContain('button--primary')
    fireEvent.click(aiTalkButton)
    expect(prefetchMock).toHaveBeenCalledWith('/ai-talk')
    expect(pushMock).toHaveBeenCalledWith('/ai-talk')
    expect(screen.getByRole('link', { name: 'AI Talk' })).toHaveAttribute(
      'href',
      '/zh/ai-talk',
    )
    expect(screen.getByRole('link', { name: '概览' })).toHaveAttribute('aria-current', 'page')
  })

  it('should render english static copy and keep profile nav active on en locale', () => {
    activeLocale = 'en'
    pathnameState = '/en/profile'

    render(
      <ThemeModeProvider>
        <ProfileOverviewShell locale="en" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'Public Profile Overview' })).toBeInTheDocument()
    expect(screen.getByText('Experience')).toBeInTheDocument()
    const aiTalkButton = screen.getByRole('button', { name: 'Open AI Talk' })
    expect(aiTalkButton).toBeInTheDocument()
    fireEvent.click(aiTalkButton)
    expect(pushMock).toHaveBeenCalledWith('/ai-talk')
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page')
  })
})

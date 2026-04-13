import { cleanup, render, screen, within } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

let activeLocale: 'zh' | 'en' = 'zh'
let pathnameState = '/zh/ai-talk'

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

import { AiTalkEntryShell } from '../entry-shell'
import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

describe('AiTalkEntryShell', () => {
  beforeEach(() => {
    activeLocale = 'zh'
    pathnameState = '/zh/ai-talk'
    cleanup()
  })

  it('should render the hero row and three feature cards', () => {
    render(
      <ThemeModeProvider>
        <AiTalkEntryShell
          apiBaseUrl="http://localhost:5577"
          locale="zh"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'AI Talk 页面入口' })).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-hub-row')).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-hub-primary')).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-hub-profile')).toBeInTheDocument()

    const ragCard = screen.getByTestId('ai-talk-card-rag')
    const resumeAdvisorCard = screen.getByTestId('ai-talk-card-resumeAdvisor')
    const avatarCard = screen.getByTestId('ai-talk-card-avatar')

    expect(within(ragCard).getAllByText('RAG 知识库 / 分身问答')).not.toHaveLength(0)
    const ragLink = within(ragCard).getByRole('link', { name: '进入 RAG 对话' })
    expect(ragLink).toHaveAttribute('href', '/zh/ai-talk/chat')
    expect(ragLink.className).toContain('bg-[var(--display-color-accent)]')
    expect(ragLink.className).toContain('text-white')

    expect(within(resumeAdvisorCard).getAllByText('简历优化与建议')).not.toHaveLength(0)
    expect(within(resumeAdvisorCard).getByRole('link', { name: '查看优化说明' })).toHaveAttribute(
      'href',
      '/zh/ai-talk/resume-advisor',
    )

    expect(within(avatarCard).getAllByText('数字人 / 自我介绍')).not.toHaveLength(0)
    expect(within(avatarCard).getAllByText(/coming soon/i)).not.toHaveLength(0)
    expect(within(avatarCard).getByRole('link', { name: '查看数字人入口' })).toHaveAttribute(
      'href',
      '/zh/ai-talk/avatar',
    )
    expect(screen.getByRole('link', { name: 'AI Talk' })).toHaveAttribute('aria-current', 'page')
  })

  it('should render english copy and keep ai-talk nav active on en locale', () => {
    activeLocale = 'en'
    pathnameState = '/en/ai-talk'

    render(
      <ThemeModeProvider>
        <AiTalkEntryShell
          apiBaseUrl="http://localhost:5577"
          locale="en"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )

    expect(screen.getByRole('heading', { name: 'AI Talk Entry Hub' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Resume' })).toHaveAttribute('href', '/en')
    expect(screen.getByRole('link', { name: 'Profile' })).toHaveAttribute('href', '/en/profile')
    expect(screen.getByRole('link', { name: 'AI Talk' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Open RAG chat' })).toHaveAttribute(
      'href',
      '/en/ai-talk/chat',
    )
  })
})

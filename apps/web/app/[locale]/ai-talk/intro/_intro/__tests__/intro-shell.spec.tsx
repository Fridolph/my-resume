import { fireEvent, render, screen, within } from '@testing-library/react'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

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

function renderIntroShell() {
  return render(
    <ThemeModeProvider>
      <AiTalkIntroShell locale="zh" publishedResume={publishedResumeFixture} />
    </ThemeModeProvider>,
  )
}

describe('AiTalkIntroShell', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('should render the guided intro two-column shell and locked topic grid', () => {
    renderIntroShell();

    expect(screen.getByTestId('ai-talk-intro-shell')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /AI Intro/ })).toBeInTheDocument()
    expect(screen.getByText('引导式问题')).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-intro-thread-preview')).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-intro-question-list').children).toHaveLength(10)
    expect(screen.getByTestId('ai-talk-intro-unlock-grid').children).toHaveLength(10)
    expect(screen.getByTestId('ai-talk-intro-fragment-latestProject')).toHaveAttribute('data-state', 'locked')
    expect(screen.getByText('最近项目')).toBeInTheDocument()
    expect(screen.getByText('兴趣爱好')).toBeInTheDocument()
  })

  it('should complete a preset question and append the local answer', () => {
    renderIntroShell()

    const latestProjectQuestion = screen.getByRole('button', {
      name: '你最近一个项目做了什么？',
    })

    fireEvent.click(latestProjectQuestion)

    const threadPreview = within(screen.getByTestId('ai-talk-intro-thread-preview'))

    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    expect(threadPreview.getByText('你最近一个项目做了什么？')).toBeInTheDocument()
    expect(threadPreview.getByText(/最近围绕 my-resume 做公开站 AI Chat/)).toBeInTheDocument()
    expect(screen.getByTestId('ai-talk-intro-fragment-latestProject')).toHaveAttribute('data-state', 'completed')
    expect(screen.getByText('my-resume')).toBeInTheDocument()
    expect(screen.getByText(/已解锁最近项目/)).toBeInTheDocument()
    expect(latestProjectQuestion).toBeDisabled()
  })

  it('should restore completed questions from localStorage', () => {
    window.localStorage.setItem(
      'my-resume:ai-intro:v1:zh',
      JSON.stringify({ completedTopics: ['latestProject'] }),
    )

    renderIntroShell()

    expect(screen.getByText('1 / 10')).toBeInTheDocument()
    expect(screen.getByText(/最近围绕 my-resume 做公开站 AI Chat/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '你最近一个项目做了什么？' })).toBeDisabled()
  })

  it('should show the complete persona map after all questions are completed', () => {
    renderIntroShell()

    const questions = [
      '你是谁，当前主要方向是什么？',
      '你最近一个项目做了什么？',
      '你主要使用哪些技术？',
      '你是怎么把 AI 用到项目里的？',
      '你对 RAG 或 Agent 做过哪些实践？',
      '你如何保证项目质量和可维护性？',
      '你有哪些协作或推进经验？',
      '你工作之外有哪些兴趣？',
      '你有哪些文章、学习笔记或公开输出？',
      '你接下来想继续深挖什么？',
    ]

    questions.forEach((question) => {
      fireEvent.click(screen.getByRole('button', { name: question }))
    })

    expect(screen.getByText('10 / 10')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByText('完整画像已解锁')).toBeInTheDocument()
    expect(screen.getAllByTestId(/ai-talk-intro-fragment-/)).toHaveLength(10)
    screen.getAllByTestId(/ai-talk-intro-fragment-/).forEach((fragment) => {
      expect(fragment).toHaveAttribute('data-state', 'completed')
    })
  })
})

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const replaceMock = vi.fn()
const pathnameMock = vi.fn(() => '/')

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
  usePathname: () => pathnameMock(),
  useRouter: () => ({
    replace: replaceMock,
  }),
}))

vi.mock('alova/client', async () => {
  const React = await import('react')

  return {
    useRequest: (methodHandler: any, config?: { immediate?: boolean; initialData?: unknown }) => {
      const [data, setData] = React.useState(config?.initialData)
      const [loading, setLoading] = React.useState(false)
      const [error, setError] = React.useState<Error | undefined>(undefined)

      const send = React.useCallback(async (...args: unknown[]) => {
        setLoading(true)
        setError(undefined)

        try {
          const method =
            typeof methodHandler === 'function' ? methodHandler(...args) : methodHandler
          const result = await method.send()
          setData(result)
          return result
        } catch (nextError) {
          const normalizedError =
            nextError instanceof Error ? nextError : new Error('request failed')
          setError(normalizedError)
          throw normalizedError
        } finally {
          setLoading(false)
        }
      }, [methodHandler])

      React.useEffect(() => {
        if (!config?.immediate) {
          return
        }

        void send()
      }, [config?.immediate, send])

      return {
        data,
        error,
        loading,
        send,
      }
    },
  }
})

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

import { PublishedResumeShell } from '../shell'
import { publishedResumeFixture } from '@shared/published-resume/__tests__/fixture'

describe('PublishedResumeShell', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    pathnameMock.mockReset()
    pathnameMock.mockReturnValue('/')
    cleanup()
  })

  function renderShell() {
    return render(
      <ThemeModeProvider>
        <PublishedResumeShell locale="zh" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )
  }

  it('should render direct resume reading flow on home and switch locale', async () => {
    const user = userEvent.setup()

    renderShell()

    expect(screen.getByRole('link', { name: '简历' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '概览' })).toHaveAttribute('href', '/zh/profile')
    expect(screen.getByRole('link', { name: 'AI Talk' })).toHaveAttribute(
      'href',
      '/zh/ai-talk',
    )
    expect(screen.getByTestId('public-site-brand-text')).toHaveClass('hidden', 'md:flex')
    expect(screen.getByTestId('public-site-nav-shell')).toHaveClass('hidden', 'sm:flex')
    expect(screen.getByTestId('public-site-mobile-menu')).toHaveClass('sm:hidden')
    expect(screen.getByTestId('public-site-desktop-actions')).toHaveClass('hidden', 'sm:flex')
    expect(screen.getByTestId('public-site-nav')).toHaveClass(
      'inline-flex',
      'flex-nowrap',
      'whitespace-nowrap',
    )
    expect(screen.getByRole('heading', { name: '付寅生' })).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: '职业经历' }, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: '代表项目' }, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(screen.getByAltText('付寅生头像正面')).toBeInTheDocument()
    expect(screen.getByAltText('付寅生头像背面')).toBeInTheDocument()
    expect(screen.getByText('热爱Coding，生命不息，折腾不止')).toBeInTheDocument()
    expect(screen.getByText('羽毛球爱好者，快乐挥拍，球场飞翔')).toBeInTheDocument()
    expect(screen.getByText('上海')).toBeInTheDocument()
    expect(screen.getByText('demo@example.com')).toBeInTheDocument()
    expect(screen.getByText('+86 13800000000')).toBeInTheDocument()
    expect(screen.getByText('羽毛球')).toBeInTheDocument()
    expect(screen.getByText('摄影')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '四川大学锦江学院' })).toBeInTheDocument()
    expect(screen.queryByText('https://example.com')).not.toBeInTheDocument()
    expect(screen.queryByText('保留稳定学历信息，避免和项目型内容混排。')).not.toBeInTheDocument()
    expect(screen.getAllByTestId('resume-education-item')[0]).not.toHaveClass('timelineCardSurface')
    expect(screen.getByRole('link', { name: '技术博客' })).toHaveAttribute(
      'href',
      'https://example.com/blog',
    )
    expect(
      await screen.findByText('聚焦过往公司的职责范围、业务场景与关键成果。'),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('按标准模型展示项目背景、职责、亮点与技术栈。'),
    ).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '前端架构落地' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'AI 工程化实践' })).toBeInTheDocument()
    expect(await screen.findByText('项目核心功能')).toBeInTheDocument()
    expect(await screen.findByText('亮点、难点与解决方案')).toBeInTheDocument()
    expect(await screen.findByText('覆盖公开展示、后台编辑与内容发布链路。')).toBeInTheDocument()
    expect(await screen.findByText('技能结构')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '图表' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '结构' })).toBeInTheDocument()
    expect(await screen.findByLabelText('技能雷达图')).toBeInTheDocument()
    expect(await screen.findByText('关键词云')).toBeInTheDocument()
    expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0)
    expect(document.querySelector('aside')?.className).toContain('lg:top-[5.5rem]')
    expect(
      screen.queryByRole('heading', { name: '公开简历速览' }),
    ).not.toBeInTheDocument()
    expect(
      (await screen.findByRole('button', { name: '打开项目 GitHub 仓库' })).closest('a'),
    ).toHaveAttribute('href', 'https://github.com/Fridolph/my-resume')
    await screen.findByTestId('hero-tooltip-ready')
    await user.hover(screen.getByRole('link', { name: 'GitHub' }))
    expect(await screen.findByText('GitHub')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(replaceMock).toHaveBeenCalledWith('/', { locale: 'en' })
  }, 10000)

  it('should render grouped mobile menu and keep navigation/toggle/download/social actions working', async () => {
    const user = userEvent.setup()

    const view = render(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          locale="zh"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )

    await user.click(screen.getByRole('button', { name: '打开站点菜单' }))

    expect(await screen.findByRole('menuitem', { name: '简历' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '概览' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'AI Talk' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: '中' })).not.toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'EN' })).not.toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Select Lang: EN' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '切换主题：深色' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '导出 Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/markdown?locale=zh',
    )
    expect(screen.getByRole('menuitem', { name: '导出 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/pdf?locale=zh',
    )
    expect(screen.getByRole('menuitem', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/Fridolph/my-resume',
    )
    expect(screen.getAllByRole('separator').length).toBeGreaterThanOrEqual(3)
    expect(screen.getByText('导航')).toBeInTheDocument()
    expect(screen.getByText('切换')).toBeInTheDocument()
    expect(screen.getByText('下载')).toBeInTheDocument()
    expect(screen.getByText('社交')).toBeInTheDocument()
    expect(
      screen.getAllByText(/^(导航|切换|下载|社交)$/).map((item) => item.textContent),
    ).toEqual(['导航', '切换', '下载', '社交'])

    replaceMock.mockClear()
    await user.click(screen.getByRole('menuitem', { name: '概览' }))
    expect(replaceMock).toHaveBeenCalledWith('/profile')
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: '简历' })).not.toBeInTheDocument()
    })

    replaceMock.mockClear()
    await user.click(screen.getByRole('button', { name: '打开站点菜单' }))
    await user.click(screen.getByRole('menuitem', { name: 'Select Lang: EN' }))
    expect(replaceMock).toHaveBeenCalledWith('/', { locale: 'en' })
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: '简历' })).not.toBeInTheDocument()
    })

    view.rerender(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          locale="en"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )
    await user.click(screen.getByRole('button', { name: '打开站点菜单' }))
    expect(await screen.findByRole('menuitem', { name: '切换语言：中文' })).toBeInTheDocument()

    expect(document.documentElement.dataset.theme).toBe('light')
    await user.click(screen.getByRole('menuitem', { name: '切换主题：深色' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: '简历' })).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '打开站点菜单' }))
    expect(await screen.findByRole('menuitem', { name: '切换主题：浅色' })).toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: '切换主题：浅色' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('should strip locale prefix before switching from en back to zh on home', async () => {
    const user = userEvent.setup()

    pathnameMock.mockReturnValue('/en')

    render(
      <ThemeModeProvider>
        <PublishedResumeShell locale="en" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    await user.click(screen.getByRole('button', { name: '中' }))

    expect(replaceMock).toHaveBeenCalledWith('/', { locale: 'zh' })
  })

  it('should strip locale prefix before switching from en back to zh on nested routes', async () => {
    const user = userEvent.setup()

    pathnameMock.mockReturnValue('/en/profile')

    render(
      <ThemeModeProvider>
        <PublishedResumeShell locale="en" publishedResume={publishedResumeFixture} />
      </ThemeModeProvider>,
    )

    await user.click(screen.getByRole('button', { name: '中' }))

    expect(replaceMock).toHaveBeenCalledWith('/profile', { locale: 'zh' })
  })

  it('should hide empty optional field blocks like experience location', () => {
    const fixtureWithoutLocation = {
      ...publishedResumeFixture,
      resume: {
        ...publishedResumeFixture.resume,
        experiences: publishedResumeFixture.resume.experiences.map((item, index) =>
          index === 0
            ? {
                ...item,
                location: {
                  zh: '',
                  en: '',
                },
              }
            : item,
        ),
      },
    }

    render(
      <ThemeModeProvider>
        <PublishedResumeShell locale="zh" publishedResume={fixtureWithoutLocation} />
      </ThemeModeProvider>,
    )

    expect(screen.queryByText('地点')).not.toBeInTheDocument()
    expect(screen.queryByText('Location')).not.toBeInTheDocument()
  })

  it('should toggle light and dark theme on the document element', async () => {
    const user = userEvent.setup()

    const { container } = renderShell()

    expect(await screen.findByRole('switch', { name: '切换明暗主题' })).toBeInTheDocument()
    expect(container.querySelector('[data-slot="switch-control"]')).toBeInTheDocument()
    expect(document.documentElement.dataset.theme).toBe('light')

    await user.click(await screen.findByRole('switch', { name: '切换明暗主题' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('dark')

    await user.click(await screen.findByRole('switch', { name: '切换明暗主题' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(window.localStorage.getItem('my-resume-theme-mode')).toBe('light')
  })

  it('should render export entries in download menu and switch locale in urls', async () => {
    const user = userEvent.setup()

    const view = render(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          locale="zh"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )

    await user.click(await screen.findByRole('button', { name: '打开下载菜单' }))

    expect(await screen.findByRole('menuitem', { name: '导出 Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/markdown?locale=zh',
    )
    expect(await screen.findByRole('menuitem', { name: '导出 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/pdf?locale=zh',
    )

    await user.keyboard('{Escape}')
    view.rerender(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          locale="en"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )
    await user.click(await screen.findByRole('button', { name: '打开下载菜单' }))

    expect(await screen.findByRole('menuitem', { name: '导出 Markdown' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/markdown?locale=en',
    )
    expect(await screen.findByRole('menuitem', { name: '导出 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/api/resume/published/export/pdf?locale=en',
    )
  })

  it('should switch skill views between chart and structure', async () => {
    const user = userEvent.setup()

    renderShell()

    expect(await screen.findByLabelText('技能雷达图')).toBeInTheDocument()
    expect(await screen.findByText('关键词云')).toBeInTheDocument()
    expect((await screen.findAllByText('Node.js')).length).toBeGreaterThan(0)
    expect(await screen.findByRole('button', { name: '雷达图' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: '饼图' })).toBeInTheDocument()
    expect(screen.queryByText(/占比/)).not.toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '饼图' }))
    expect(screen.getByLabelText('技能饼图')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '结构' }))
    expect(screen.getAllByText('TypeScript').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/熟练掌握 Vue2\/3、Nuxt、Composition API、Pinia/),
    ).toBeInTheDocument()
    expect(screen.queryByText('关键词云')).not.toBeInTheDocument()
  })

  it('should render empty state when no published content is available', () => {
    render(
      <ThemeModeProvider>
        <PublishedResumeShell locale="zh" publishedResume={null} />
      </ThemeModeProvider>,
    )

    expect(screen.getByText('当前还没有已发布的公开简历内容。')).toBeInTheDocument()
  })

  it('should sync to newer snapshot after mount when client sync is enabled', async () => {
    const syncPublishedResume = vi.fn().mockResolvedValue({
      ...publishedResumeFixture,
      publishedAt: '2026-03-26T00:00:00.000Z',
      resume: {
        ...publishedResumeFixture.resume,
        profile: {
          ...publishedResumeFixture.resume.profile,
          fullName: {
            zh: '最新付寅生',
            en: 'Latest Yinsheng Fu',
          },
        },
      },
    })
    const createSyncPublishedResumeMethod = vi.fn(() => ({
      send: syncPublishedResume,
    }))

    render(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          createSyncPublishedResumeMethod={createSyncPublishedResumeMethod as any}
          enableClientSync
          locale="zh"
          publishedResume={publishedResumeFixture}
        />
      </ThemeModeProvider>,
    )

    expect(screen.queryByText('正在后台同步最新发布快照...')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '付寅生' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '最新付寅生' })).toBeInTheDocument()
    expect(screen.queryByText('正在后台同步最新发布快照...')).not.toBeInTheDocument()
    expect(createSyncPublishedResumeMethod).toHaveBeenCalledTimes(1)
    expect(createSyncPublishedResumeMethod).toHaveBeenCalledWith({
      apiBaseUrl: 'http://localhost:5577',
    })
    expect(syncPublishedResume).toHaveBeenCalledTimes(1)
  })

  it('should avoid duplicate key warnings when english fields are empty or repeated', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const duplicateKeyFixture = {
      ...publishedResumeFixture,
      resume: {
        ...publishedResumeFixture.resume,
        experiences: publishedResumeFixture.resume.experiences.map((experience, index) =>
          index === 0
            ? {
                ...experience,
                highlights: [
                  {
                    zh: '重复高亮一',
                    en: '',
                  },
                  {
                    zh: '重复高亮二',
                    en: '',
                  },
                ],
              }
            : experience,
        ),
        projects: publishedResumeFixture.resume.projects.map((project, index) =>
          index === 0
            ? {
                ...project,
                highlights: [
                  {
                    zh: '重复项目亮点一',
                    en: '',
                  },
                  {
                    zh: '重复项目亮点二',
                    en: '',
                  },
                ],
              }
            : project,
        ),
        skills: publishedResumeFixture.resume.skills.map((group, index) => ({
          ...group,
          name: {
            ...group.name,
            en: '',
          },
          keywords:
            index === 0 ? ['**Node.js**: 能力描述', '**Node.js**: 能力描述'] : group.keywords,
        })),
      },
    }

    render(
      <ThemeModeProvider>
        <PublishedResumeShell locale="zh" publishedResume={duplicateKeyFixture} />
      </ThemeModeProvider>,
    )

    expect(await screen.findByRole('heading', { name: '职业经历' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '代表项目' })).toBeInTheDocument()
    expect(await screen.findByText('关键词云')).toBeInTheDocument()

    const duplicateKeyCalls = consoleErrorSpy.mock.calls.filter(([message]) =>
      typeof message === 'string'
        ? message.includes('Encountered two children with the same key')
        : false,
    )

    expect(duplicateKeyCalls).toHaveLength(0)

    consoleErrorSpy.mockRestore()
  })
})

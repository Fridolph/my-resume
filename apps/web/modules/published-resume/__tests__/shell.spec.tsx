import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeModeProvider } from '@my-resume/ui/theme'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const replaceMock = vi.fn()
const pathnameMock = vi.fn(() => '/')

vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: any) => (
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

vi.mock('next-intl', () => ({
  useTranslations:
    (namespace: string) =>
    (key: string): string => {
      if (namespace !== 'site') {
        return key
      }

      const map: Record<string, string> = {
        aiTalkNav: 'AI Talk',
        brandName: 'Fridolph Resume',
        downloadAriaLabel: '打开下载菜单',
        downloadMenuLabel: '下载',
        exportMarkdownMenu: '导出 Markdown',
        exportPdfMenu: '导出 PDF',
        githubAriaLabel: '打开项目 GitHub 仓库',
        langEn: 'EN',
        langZh: '中',
        profileNav: '概览',
        resumeNav: '简历',
        themeSwitchAriaLabel: '切换明暗主题',
      }

      return map[key] ?? key
    },
}))

import { PublishedResumeShell } from '../shell'
import { publishedResumeFixture } from './fixture'

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
    expect(screen.queryByText('https://example.com')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: '技术博客' })).toHaveAttribute(
      'href',
      'https://example.com/blog',
    )
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
      'http://localhost:5577/resume/published/export/markdown?locale=zh',
    )
    expect(await screen.findByRole('menuitem', { name: '导出 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/pdf?locale=zh',
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
      'http://localhost:5577/resume/published/export/markdown?locale=en',
    )
    expect(await screen.findByRole('menuitem', { name: '导出 PDF' })).toHaveAttribute(
      'href',
      'http://localhost:5577/resume/published/export/pdf?locale=en',
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

    render(
      <ThemeModeProvider>
        <PublishedResumeShell
          apiBaseUrl="http://localhost:5577"
          enableClientSync
          locale="zh"
          publishedResume={publishedResumeFixture}
          syncPublishedResume={syncPublishedResume}
        />
      </ThemeModeProvider>,
    )

    expect(await screen.findByRole('heading', { name: '最新付寅生' })).toBeInTheDocument()
    expect(syncPublishedResume).toHaveBeenCalledWith({
      apiBaseUrl: 'http://localhost:5577',
    })
  })
})

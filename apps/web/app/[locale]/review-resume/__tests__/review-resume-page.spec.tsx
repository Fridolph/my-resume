import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ReviewResumePage from '../page'

let routeLocale = 'zh'

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: routeLocale }),
}))

function createResumePayload(locale: 'zh' | 'en' = 'zh') {
  const isEn = locale === 'en'

  return {
    code: 200,
    data: {
      status: 'published',
      publishedAt: '2026-07-03T08:05:25.115Z',
      resume: {
        meta: {
          slug: 'standard-resume',
          version: 1,
          defaultLocale: 'zh',
          locales: ['zh', 'en'],
        },
        profile: {
          fullName: isEn ? 'Yinsheng Fu' : '付寅生',
          headline: isEn ? 'AI Developer / JS Full Stack' : 'AI 开发 / JS全栈',
          summary: isEn ? 'Full-stack engineer learning AI Agent.' : '十年前端老兵 JS全栈 + AI Agent 学习中。',
          location: isEn ? 'Chengdu, China' : '中国 四川 成都',
          email: 'demo@example.com',
          phone: '16600000000',
          website: 'https://resume.example.com',
          links: [
            {
              label: 'Github',
              url: 'https://github.com/Fridolph',
            },
          ],
          interests: [
            {
              label: isEn ? 'Badminton' : '羽毛球',
            },
          ],
          hero: {
            frontImageUrl: 'https://example.com/avatar.png',
            backImageUrl: '',
            linkUrl: '',
            slogans: [],
          },
        },
        highlights: [
          {
            title: isEn ? 'AI Practice' : 'AI 工程化实践',
            description: isEn ? 'Agent workflow practice.' : '从 0 到 1 搭建多 Agent 工作流。',
          },
        ],
        education: [
          {
            schoolName: isEn ? 'Sichuan University Jinjiang College' : '四川大学锦江学院',
            degree: isEn ? 'Bachelor' : '本科',
            fieldOfStudy: isEn ? 'Communication Engineering' : '通信工程',
            startDate: '2012.09',
            endDate: '2016.06',
            location: '',
            highlights: [],
          },
        ],
        skills: [
          {
            name: isEn ? 'Frontend Core' : '前端核心能力',
            keywords: [isEn ? 'React and Next.js' : 'React 与 Next.js'],
            proficiency: 94,
          },
        ],
        experiences: [
          {
            companyName: isEn ? 'GreenSketch' : '成都澳昇能源科技有限责任公司',
            role: isEn ? 'Frontend Engineer' : '前端开发',
            employmentType: isEn ? 'Full-time' : '全职',
            startDate: '2024.08',
            endDate: isEn ? 'Present' : '至今',
            location: '',
            summary: isEn ? 'Responsible for core frontend delivery.' : '负责 C 端核心业务开发。',
            highlights: [isEn ? 'Improved quote flow.' : '优化项目创建到报价流程。'],
            technologies: ['Next.js', 'TypeScript'],
          },
        ],
        projects: [
          {
            name: 'my-resume',
            role: isEn ? 'Full-stack developer' : '全栈开发',
            startDate: '2026.03',
            endDate: isEn ? 'Present' : '至今',
            summary: isEn ? 'Personal resume platform.' : '个人简历综合展示与管理平台。',
            coreFunctions: isEn ? 'Publishing and PDF export.' : '后台草稿编辑与发布、简历导出。',
            highlights: [isEn ? 'Built from scratch.' : '从 0 到 1 设计 Monorepo 架构。'],
            technologies: ['Next.js', 'NestJS'],
            links: [],
          },
        ],
      },
    },
    message: 'OK',
    timestamp: '2026-07-06T03:47:12.289Z',
    traceId: 'trace-id',
  }
}

function mockPublishedResume(locale: 'zh' | 'en' = 'zh') {
  const fetchMock = vi.fn().mockResolvedValueOnce(
    new Response(JSON.stringify(createResumePayload(locale)), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

beforeEach(() => {
  routeLocale = 'zh'
  window.history.pushState({}, '', '/zh/review-resume?locale=zh')
  vi.restoreAllMocks()
})

describe('ReviewResumePage', () => {
  it('should fetch published resume with locale and render flattened fields', async () => {
    mockPublishedResume('zh')

    render(<ReviewResumePage />)

    expect(await screen.findByText('付寅生')).toBeInTheDocument()
    expect(screen.getByText('AI 开发 / JS全栈')).toBeInTheDocument()
    expect(screen.getByText('前端核心能力')).toBeInTheDocument()
    expect(screen.queryByText('94%')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'https://resume.example.com' })).toHaveAttribute(
      'target',
      '_blank',
    )
    expect(screen.getByText('my-resume')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/resume/published?locale=zh',
      expect.objectContaining({ cache: 'no-store' }),
    )
  })

  it('should request the server PDF and show loading while downloading', async () => {
    const fetchMock = mockPublishedResume('zh')
    let resolvePdf!: (response: Response) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolvePdf = resolve
        }),
    )
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:resume'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    render(<ReviewResumePage />)

    await screen.findByText('付寅生')
    fireEvent.click(screen.getByRole('button', { name: /下载 PDF/ }))

    expect(fetchMock).toHaveBeenLastCalledWith(
      'http://localhost:5577/api/resume/published/export/pdf?locale=zh',
      { cache: 'no-store' },
    )
    expect(screen.getByRole('button', { name: /生成中/ })).toBeDisabled()

    resolvePdf(new Response('%PDF-real', { status: 200 }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /下载 PDF/ })).not.toBeDisabled()
    })
  })

  it('should render readable error state when published resume request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    )

    render(<ReviewResumePage />)

    expect(await screen.findByText('简历预览暂不可用')).toBeInTheDocument()
    expect(screen.getByText('Resume request failed: 500')).toBeInTheDocument()
  })

  it('should show export error and recover the download button when pdf export fails', async () => {
    const fetchMock = mockPublishedResume('zh')
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }))

    render(<ReviewResumePage />)

    await screen.findByText('付寅生')
    fireEvent.click(screen.getByRole('button', { name: /下载 PDF/ }))

    expect(
      await screen.findByText('PDF request failed: 503'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /下载 PDF/ })).not.toBeDisabled()
  })

  it('should prefer query locale and render english preview', async () => {
    routeLocale = 'zh'
    window.history.pushState({}, '', '/zh/review-resume?locale=en')
    mockPublishedResume('en')

    render(<ReviewResumePage />)

    expect(await screen.findByText('Yinsheng Fu')).toBeInTheDocument()
    expect(screen.getByText('Resume Preview')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/resume/published?locale=en',
      expect.objectContaining({ cache: 'no-store' }),
    )
  })
})

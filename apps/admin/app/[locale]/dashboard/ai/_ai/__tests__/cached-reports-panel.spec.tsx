'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AiCachedReportsPanel } from '../components/cached-reports-panel'

vi.mock('alova/client', async () => {
  const React = await import('react')

  return {
    useRequest: (methodHandler: any, config?: { initialData?: unknown }) => {
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

      return { data, error, loading, send }
    },
  }
})

afterEach(() => {
  cleanup()
})

const cachedReports = [
  {
    reportId: 'jd-match-demo',
    scenario: 'jd-match',
    locale: 'zh',
    summary: '缓存版 JD 匹配预览',
    generator: 'mock-cache' as const,
    createdAt: '2026-03-27T00:00:00.000Z',
  },
  {
    reportId: 'resume-review-demo',
    scenario: 'resume-review',
    locale: 'en',
    summary: 'Cached resume review preview',
    generator: 'mock-cache' as const,
    createdAt: '2026-03-27T00:00:00.000Z',
  },
]

const reportDetails = {
  'jd-match-demo': {
    reportId: 'jd-match-demo',
    cacheKey: 'jd-match:zh:demo',
    scenario: 'jd-match' as const,
    locale: 'zh' as const,
    sourceHash: 'demo',
    inputPreview: 'NestJS React TypeScript',
    summary: '缓存版 JD 匹配预览',
    sections: [
      {
        key: 'match-overview',
        title: '匹配概览',
        bullets: ['当前输入已经覆盖 NestJS 与 React。'],
      },
    ],
    generator: 'mock-cache' as const,
    createdAt: '2026-03-27T00:00:00.000Z',
  },
  'resume-review-demo': {
    reportId: 'resume-review-demo',
    cacheKey: 'resume-review:en:demo',
    scenario: 'resume-review' as const,
    locale: 'en' as const,
    sourceHash: 'demo',
    inputPreview: 'Resume review for full-stack engineer',
    summary: 'Cached resume review preview',
    sections: [
      {
        key: 'strengths',
        title: 'Strengths',
        bullets: ['Content blocks are easy to reuse in tutorial mode.'],
      },
    ],
    generator: 'mock-cache' as const,
    createdAt: '2026-03-27T00:00:00.000Z',
  },
}

describe('AiCachedReportsPanel', () => {
  it('should keep empty state and skip detail loading when no cached reports exist', async () => {
    const fetchReportList = vi.fn().mockResolvedValue([])
    const fetchReportDetail = vi.fn()
    const createReportListMethod = vi.fn((input) => ({
      send: () => fetchReportList(input),
    }))
    const createReportDetailMethod = vi.fn((input) => ({
      send: () => fetchReportDetail(input),
    }))

    render(
      <AiCachedReportsPanel
        accessToken="viewer-token"
        apiBaseUrl="http://localhost:5577"
        createReportDetailMethod={createReportDetailMethod as any}
        createReportListMethod={createReportListMethod as any}
        isViewerExperience
      />,
    )

    expect(await screen.findByText('当前还没有可阅读的缓存报告。')).toBeInTheDocument()
    expect(fetchReportList).toHaveBeenCalledTimes(1)
    expect(fetchReportDetail).not.toHaveBeenCalled()
  })

  it('should show viewer-specific cache guidance and load first cached report', async () => {
    const fetchReportList = vi.fn().mockResolvedValue(cachedReports)
    const fetchReportDetail = vi
      .fn()
      .mockImplementation(({ reportId }: { reportId: keyof typeof reportDetails }) =>
        Promise.resolve(reportDetails[reportId]),
      )
    const createReportListMethod = vi.fn((input) => ({
      send: () => fetchReportList(input),
    }))
    const createReportDetailMethod = vi.fn((input) => ({
      send: () => fetchReportDetail(input),
    }))

    render(
      <AiCachedReportsPanel
        accessToken="viewer-token"
        apiBaseUrl="http://localhost:5577"
        createReportDetailMethod={createReportDetailMethod as any}
        createReportListMethod={createReportListMethod as any}
        isViewerExperience
      />,
    )

    expect(
      screen.getByText(
        'viewer 当前只读取缓存或预设分析结果，不能上传文件，也不能触发新的真实分析请求。',
      ),
    ).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchReportList).toHaveBeenCalledWith({
        accessToken: 'viewer-token',
        apiBaseUrl: 'http://localhost:5577',
      })
    })

    expect(await screen.findByText('缓存版 JD 匹配预览')).toBeInTheDocument()
    expect(screen.getByText('场景：JD 匹配分析')).toBeInTheDocument()
    expect(screen.getByText('匹配概览')).toBeInTheDocument()
    expect(screen.getByText('当前报告概览').closest('section')).toHaveClass('p-5')
    expect(screen.getByText('匹配概览').closest('article')).toHaveClass('p-5')
    expect(screen.getByRole('tab', { name: 'JD 匹配分析' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(fetchReportDetail).toHaveBeenCalledTimes(1)
  })

  it('should switch cached report detail when another report is selected', async () => {
    const user = userEvent.setup()
    const fetchReportList = vi.fn().mockResolvedValue(cachedReports)
    const fetchReportDetail = vi
      .fn()
      .mockImplementation(({ reportId }: { reportId: keyof typeof reportDetails }) =>
        Promise.resolve(reportDetails[reportId]),
      )
    const createReportListMethod = vi.fn((input) => ({
      send: () => fetchReportList(input),
    }))
    const createReportDetailMethod = vi.fn((input) => ({
      send: () => fetchReportDetail(input),
    }))

    render(
      <AiCachedReportsPanel
        accessToken="viewer-token"
        apiBaseUrl="http://localhost:5577"
        createReportDetailMethod={createReportDetailMethod as any}
        createReportListMethod={createReportListMethod as any}
        isViewerExperience={false}
      />,
    )

    expect(await screen.findByText('缓存版 JD 匹配预览')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '简历优化建议' }))

    expect(await screen.findByText('Cached resume review preview')).toBeInTheDocument()
    expect(screen.getByText('Strengths')).toBeInTheDocument()
  })

  it('should show error feedback when cached reports fail to load', async () => {
    const fetchReportList = vi.fn().mockRejectedValue(new Error('缓存报告列表加载失败'))
    const createReportListMethod = vi.fn((input) => ({
      send: () => fetchReportList(input),
    }))

    render(
      <AiCachedReportsPanel
        accessToken="viewer-token"
        apiBaseUrl="http://localhost:5577"
        createReportListMethod={createReportListMethod as any}
        isViewerExperience
      />,
    )

    expect(await screen.findByText('缓存报告列表加载失败')).toBeInTheDocument()
  })
})

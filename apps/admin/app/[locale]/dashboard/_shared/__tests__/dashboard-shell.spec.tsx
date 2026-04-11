'use client'

import { render, screen, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { useAdminSessionMock, fetchAiWorkbenchRuntimeMock, fetchDraftResumeSummaryMock } =
  vi.hoisted(() => ({
    useAdminSessionMock: vi.fn(),
    fetchAiWorkbenchRuntimeMock: vi.fn(),
    fetchDraftResumeSummaryMock: vi.fn(),
  }))

vi.mock('@core/i18n/navigation', () => ({
  Link: ({ children, href, ...props }: any) => (
    <a href={typeof href === 'string' ? href : '/'} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@core/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('alova/client', async () => {
  const React = await import('react')

  return {
    useRequest: (methodHandler: any) => {
      const [data, setData] = React.useState<unknown>(undefined)
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

vi.mock('../../ai/_ai/services/ai-workbench-api', () => ({
  createFetchAiWorkbenchRuntimeMethod: (input: any) => ({
    send: () => fetchAiWorkbenchRuntimeMock(input),
  }),
}))

vi.mock('../../resume/_resume/services/resume-draft-api', () => ({
  createFetchDraftResumeSummaryMethod: (input: any) => ({
    send: () => fetchDraftResumeSummaryMock(input),
  }),
}))

import { AdminDashboardShell } from '../dashboard-shell'

const adminUser = {
  id: 'admin-demo-user',
  username: 'admin',
  role: 'admin' as const,
  isActive: true,
  capabilities: {
    canEditResume: true,
    canPublishResume: true,
    canTriggerAiAnalysis: true,
  },
}

const viewerUser = {
  id: 'viewer-demo-user',
  username: 'viewer',
  role: 'viewer' as const,
  isActive: true,
  capabilities: {
    canEditResume: false,
    canPublishResume: false,
    canTriggerAiAnalysis: false,
  },
}

describe('AdminDashboardShell', () => {
  beforeEach(() => {
    useAdminSessionMock.mockReset()
    fetchAiWorkbenchRuntimeMock.mockReset()
    fetchDraftResumeSummaryMock.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should render dashboard overview for admin', async () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: adminUser,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    })
    fetchAiWorkbenchRuntimeMock.mockResolvedValue({
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'live',
      supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'],
    })
    fetchDraftResumeSummaryMock.mockResolvedValue({
      status: 'draft',
      updatedAt: '2026-04-03T10:00:00.000Z',
      resume: {
        meta: {
          slug: 'standard-resume',
          defaultLocale: 'zh',
          locale: 'zh',
        },
        profile: {
          headline: '资深前端工程师',
          summary: '负责前端架构与团队协作。',
        },
        counts: {
          education: 1,
          experiences: 2,
          projects: 3,
          skills: 4,
          highlights: 5,
        },
      },
    })

    render(<AdminDashboardShell locale="zh" />)

    expect(await screen.findByRole('heading', { name: '工作区概览' })).toBeInTheDocument()
    expect(screen.getByText('当前账号：admin')).toBeInTheDocument()
    expect(screen.getByText('当前角色：admin')).toBeInTheDocument()
    expect(
      screen.getByText((content) =>
        content.includes('admin 当前可继续维护草稿、触发 AI、发布内容并导出结果。'),
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('AI Provider 状态')).toBeInTheDocument()
    expect(screen.getByText('qiniu')).toBeInTheDocument()
    expect(screen.getByText('资深前端工程师')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入 AI 工作台' })).toHaveAttribute(
      'href',
      '/dashboard/ai',
    )
    await waitFor(() => {
      expect(fetchAiWorkbenchRuntimeMock).toHaveBeenCalledTimes(1)
      expect(fetchDraftResumeSummaryMock).toHaveBeenCalledTimes(1)
    })
  })

  it('should render viewer-specific guidance and skip draft summary fetch', async () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: 'viewer-token',
      currentUser: viewerUser,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    })
    fetchAiWorkbenchRuntimeMock.mockResolvedValue({
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'live',
      supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'],
    })

    render(
      <StrictMode>
        <AdminDashboardShell locale="zh" />
      </StrictMode>,
    )

    expect(await screen.findByText('当前账号：viewer')).toBeInTheDocument()
    expect(
      screen.getByText('viewer 当前只能体验缓存结果与只读链路，不能触发真实敏感操作。'),
    ).toBeInTheDocument()
    expect(screen.getByText('当前角色没有草稿读取与编辑权限。')).toBeInTheDocument()
    expect(fetchDraftResumeSummaryMock).not.toHaveBeenCalled()
  })
})

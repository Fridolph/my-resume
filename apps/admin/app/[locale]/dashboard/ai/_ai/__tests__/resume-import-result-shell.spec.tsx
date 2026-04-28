'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResumeImportResultShell } from '../resume-import-result-shell'

const {
  applyResumeImportMock,
  fetchResumeImportResultMock,
  routerPushMock,
  useAdminSessionMock,
} = vi.hoisted(() => ({
  applyResumeImportMock: vi.fn(),
  fetchResumeImportResultMock: vi.fn(),
  routerPushMock: vi.fn(),
  useAdminSessionMock: vi.fn(),
}))

vi.mock('@core/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock('alova/client', async () => {
  const React = await import('react')

  return {
    useRequest: (methodHandler: any) => {
      const [data, setData] = React.useState<unknown>(undefined)
      const [loading, setLoading] = React.useState(false)
      const [error, setError] = React.useState<Error | undefined>(undefined)

      const send = React.useCallback(
        async (...args: unknown[]) => {
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
        },
        [methodHandler],
      )

      return { data, error, loading, send }
    },
  }
})

vi.mock('../services/ai-workbench-api', () => ({
  createFetchAiResumeImportResultMethod: (input: any) => ({
    send: () => fetchResumeImportResultMock(input),
  }),
  createApplyAiResumeImportMethod: (input: any) => ({
    send: () => applyResumeImportMock(input),
  }),
}))

describe('ResumeImportResultShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAdminSessionMock.mockReturnValue({
      accessToken: 'demo-token',
      currentUser: {
        id: 'admin-demo',
        username: 'admin',
        capabilities: {
          canEditResume: true,
        },
      },
      status: 'ready',
    })
    fetchResumeImportResultMock.mockResolvedValue({
      resultId: 'resume-import-001',
      locale: 'zh',
      fileName: 'lifeiyu-mock-zh.md',
      fileType: 'md',
      charCount: 12000,
      summary: '已识别候选草稿',
      warnings: ['基本信息中的联系方式不完整，请手动核对。'],
      changedModules: ['profile', 'projects'],
      createdAt: '2026-04-28T12:00:00.000Z',
      moduleStats: {
        education: 1,
        experiences: 4,
        projects: 4,
        skills: 6,
        highlights: 5,
      },
      moduleDiffs: [
        {
          module: 'profile',
          title: '基本信息',
          status: 'changed',
          reason: '基本信息存在差异。',
          entries: [
            {
              key: 'profile',
              label: '基本信息',
              currentValue: '当前姓名',
              suggestedValue: '厉飞雨',
              status: 'changed',
            },
          ],
        },
        {
          module: 'projects',
          title: '项目经历',
          status: 'added',
          reason: '项目经历存在新增内容。',
          entries: [
            {
              key: 'projects',
              label: '项目经历',
              currentValue: '4 条',
              suggestedValue: '4 条',
              status: 'added',
            },
          ],
        },
      ],
      canApply: true,
      appliedModules: [],
      providerSummary: {
        provider: 'mock',
        model: 'mock-resume-import',
        mode: 'mock',
      },
    })
    applyResumeImportMock.mockResolvedValue({
      status: 'draft',
      updatedAt: '2026-04-28T12:10:00.000Z',
      resume: {},
    })
  })

  afterEach(() => {
    cleanup()
  })

  it('renders import diffs and applies selected modules to draft', async () => {
    const user = userEvent.setup()

    render(<ResumeImportResultShell locale="zh" resultId="resume-import-001" />)

    await waitFor(() => {
      expect(fetchResumeImportResultMock).toHaveBeenCalledWith({
        apiBaseUrl: expect.any(String),
        accessToken: 'demo-token',
        resultId: 'resume-import-001',
      })
    })

    expect(await screen.findByText('候选草稿 Diff 看台')).toBeInTheDocument()
    expect(screen.getByText('已识别候选草稿')).toBeInTheDocument()
    expect(
      screen.getByText('基本信息中的联系方式不完整，请手动核对。'),
    ).toBeInTheDocument()
    expect(screen.getByText('厉飞雨')).toBeInTheDocument()
    expect(screen.getAllByTestId('resume-import-diff-grid')[0]).toHaveClass(
      'md:grid-cols-2',
    )

    await user.click(screen.getByRole('button', { name: '写回所有已选模块' }))

    await waitFor(() => {
      expect(applyResumeImportMock).toHaveBeenCalledWith({
        apiBaseUrl: expect.any(String),
        accessToken: 'demo-token',
        resultId: 'resume-import-001',
        modules: ['profile', 'projects'],
      })
    })
    expect(
      await screen.findByText(
        '已将 基本信息、项目经历 写回草稿，公开站仍需手动发布。该识别结果已写回草稿；如需继续导入，请重新上传识别。',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText('该识别结果已写回草稿；如需继续导入，请重新上传识别。'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '写回所有已选模块' })).toBeDisabled()
  })

  it('shows apply guard when current user cannot edit resume', async () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: 'viewer-token',
      currentUser: {
        id: 'viewer-demo',
        username: 'viewer',
        capabilities: {
          canEditResume: false,
        },
      },
      status: 'ready',
    })

    render(<ResumeImportResultShell locale="zh" resultId="resume-import-001" />)

    expect(await screen.findByText('已识别候选草稿')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '写回所有已选模块' })).toBeDisabled()
  })

  it('renders imported result as read-only when it has already been applied', async () => {
    fetchResumeImportResultMock.mockResolvedValueOnce({
      resultId: 'resume-import-001',
      locale: 'zh',
      fileName: 'lifeiyu-mock-zh.md',
      fileType: 'md',
      charCount: 12000,
      summary: '已识别候选草稿',
      warnings: [],
      changedModules: ['profile'],
      createdAt: '2026-04-28T12:00:00.000Z',
      canApply: false,
      appliedModules: ['profile'],
      appliedAt: '2026-04-28T12:10:00.000Z',
      moduleStats: {
        education: 1,
        experiences: 4,
        projects: 4,
        skills: 6,
        highlights: 5,
      },
      moduleDiffs: [
        {
          module: 'profile',
          title: '基本信息',
          status: 'changed',
          reason: '基本信息存在差异。',
          entries: [
            {
              key: 'profile',
              label: '基本信息',
              currentValue: '当前姓名',
              suggestedValue: '厉飞雨',
              status: 'changed',
            },
          ],
        },
      ],
      providerSummary: {
        provider: 'mock',
        model: 'mock-resume-import',
        mode: 'mock',
      },
    })

    render(<ResumeImportResultShell locale="zh" resultId="resume-import-001" />)

    expect(
      await screen.findByText('该识别结果已写回草稿；如需继续导入，请重新上传识别。'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '写回所有已选模块' })).toBeDisabled()
    expect(await screen.findByText('已写回')).toBeInTheDocument()
  })
})

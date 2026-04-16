'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ResumeOptimizationResultShell } from '../resume-optimization-result-shell'

const {
  applyResumeOptimizationMock,
  fetchResumeOptimizationResultMock,
  routerPushMock,
  useAdminSessionMock,
} = vi.hoisted(() => ({
  applyResumeOptimizationMock: vi.fn(),
  fetchResumeOptimizationResultMock: vi.fn(),
  routerPushMock: vi.fn(),
  useAdminSessionMock: vi.fn(),
}))

vi.mock('@core/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('../../../resume/_resume/utils/resume-locale', () => ({
  readResumeLocaleCookie: () => 'zh',
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

vi.mock('../services/ai-workbench-api', () => ({
  createFetchAiResumeOptimizationResultMethod: (input: any) => ({
    send: () => fetchResumeOptimizationResultMock(input),
  }),
  createApplyAiResumeOptimizationMethod: (input: any) => ({
    send: () => applyResumeOptimizationMock(input),
  }),
}))

describe('ResumeOptimizationResultShell', () => {
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
  })

  afterEach(() => {
    cleanup()
  })

  it('should fetch and render result detail, then support reset and single-module apply', async () => {
    const user = userEvent.setup()
    fetchResumeOptimizationResultMock.mockResolvedValue({
      resultId: 'result-demo-001',
      locale: 'zh',
      summary: '已生成结构化建议',
      focusAreas: ['强化摘要', '补强项目亮点'],
      changedModules: ['profile', 'projects'],
      createdAt: '2026-03-30T00:00:00.000Z',
      moduleDiffs: [
        {
          module: 'profile',
          title: '个人定位与摘要',
          reason: '个人摘要决定面试官最先看到的岗位定位。',
          entries: [
            {
              key: 'profile-summary',
              label: '个人摘要',
              currentValue: '原始摘要',
              suggestion: '建议将个人摘要改写得更贴近目标岗位。',
              reason: '个人摘要决定招聘方第一眼如何判断岗位匹配度。',
              suggestedValue: '建议摘要',
            },
          ],
        },
        {
          module: 'projects',
          title: '项目摘要与亮点',
          reason: '项目经历能证明技术方案、业务场景和个人贡献。',
          entries: [
            {
              key: 'project-summary',
              label: '项目摘要',
              currentValue: '旧项目摘要',
              suggestion: '建议将项目摘要改写得更聚焦技术方案。',
              reason: '项目摘要用于连接技术方案、业务场景与个人贡献。',
              suggestedValue: '新项目摘要',
            },
          ],
        },
      ],
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    })
    applyResumeOptimizationMock.mockResolvedValue({
      status: 'draft',
      updatedAt: '2026-03-31T00:00:00.000Z',
      resume: {},
    })

    render(<ResumeOptimizationResultShell locale="zh" resultId="result-demo-001" />)

    await waitFor(() => {
      expect(fetchResumeOptimizationResultMock).toHaveBeenCalledWith({
        apiBaseUrl: expect.any(String),
        accessToken: 'demo-token',
        locale: 'zh',
        resultId: 'result-demo-001',
      })
    })

    expect(await screen.findByText('个人定位与摘要')).toBeInTheDocument()
    expect(screen.getByText('原始摘要')).toBeInTheDocument()
    expect(screen.getByText('建议摘要')).toBeInTheDocument()
    expect(screen.getAllByText('建议说明').length).toBeGreaterThan(0)
    expect(screen.getByText('建议将个人摘要改写得更贴近目标岗位。')).toBeInTheDocument()
    expect(screen.getAllByText('原因说明').length).toBeGreaterThan(0)
    expect(screen.getByText('个人摘要决定招聘方第一眼如何判断岗位匹配度。')).toBeInTheDocument()
    expect(screen.getAllByTestId('resume-diff-current-section')[0]).toHaveClass('bg-white/92')
    expect(screen.getAllByTestId('resume-diff-grid')[0]).toHaveClass('grid-cols-2', 'md:grid-cols-4')
    expect(screen.getAllByTestId('resume-diff-suggested-section')[0]).toHaveClass('!bg-rose-50/80')
    expect(screen.getAllByTestId('resume-diff-suggested-section')[0]).toHaveClass('!border-rose-200/80')
    expect(screen.getAllByTestId('resume-diff-suggestion-section')[0]).toHaveClass('!bg-sky-50/75')
    expect(screen.getAllByTestId('resume-diff-suggestion-section')[0]).toHaveClass('!border-sky-200/70')
    expect(screen.getAllByTestId('resume-diff-reason-section')[0]).toHaveClass('!bg-amber-50/80')
    expect(screen.getAllByTestId('resume-diff-reason-section')[0]).toHaveClass('!border-amber-200/70')
    expect(screen.getAllByTestId('resume-diff-suggestion-section')[0]).toBeInTheDocument()
    expect(screen.getAllByTestId('resume-diff-reason-section')[0]).toBeInTheDocument()
    expect(screen.getAllByText('修改内容').length).toBeGreaterThan(0)
    expect(screen.getAllByText('当前内容')[0]).toHaveClass('text-sm', 'font-bold')
    expect(screen.getAllByText('修改内容')[0]).toHaveClass('text-sm', 'font-bold')
    expect(screen.getAllByText('建议说明')[0]).toHaveClass('text-sm', 'font-bold')
    expect(screen.getAllByText('原因说明')[0]).toHaveClass('text-sm', 'font-bold')
    const currentCardContent = screen
      .getAllByTestId('resume-diff-current-section')[0]
      ?.querySelector('.card__content')
    expect(currentCardContent).toBeTruthy()
    expect(currentCardContent).toHaveClass('gap-2', 'leading-6')

    await waitFor(() => {
      expect(screen.getByText('当前已选：2 / 2')).toBeInTheDocument()
    })

    expect(screen.getAllByRole('button', { name: '已加入批量' })).toHaveLength(2)
    await user.click(screen.getAllByRole('button', { name: '重置回当前草稿' })[0]!)
    expect(
      await screen.findByText('已将个人定位从待应用列表中移除。'),
    ).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '只应用当前建议' })[1]!)

    await waitFor(() => {
      expect(applyResumeOptimizationMock).toHaveBeenCalledWith({
        apiBaseUrl: expect.any(String),
        accessToken: 'demo-token',
        resultId: 'result-demo-001',
        modules: ['projects'],
      })
    })

    expect((await screen.findAllByText('已应用')).length).toBeGreaterThan(0)
  })

  it('should show non-replayable hint when fallback result cannot apply', async () => {
    fetchResumeOptimizationResultMock.mockResolvedValue({
      resultId: 'result-legacy-001',
      locale: 'zh',
      source: 'usage-record',
      canApply: false,
      summary: '历史记录详情',
      focusAreas: ['保持可读'],
      changedModules: ['profile'],
      createdAt: '2026-03-30T00:00:00.000Z',
      moduleDiffs: [
        {
          module: 'profile',
          title: '个人定位与摘要',
          reason: '用于展示回放详情',
          entries: [
            {
              key: 'profile-summary',
              label: '个人摘要',
              currentValue: '旧摘要',
              suggestion: '建议改写摘要',
              reason: '便于求职目标对齐',
              suggestedValue: '新摘要',
            },
          ],
        },
      ],
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    })

    render(<ResumeOptimizationResultShell locale="zh" resultId="result-legacy-001" />)

    expect(await screen.findByText('历史记录详情')).toBeInTheDocument()
    expect(screen.getByText('该历史记录不支持再次应用，请重新生成。')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '应用所有已选模块' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '只应用当前建议' })).toBeDisabled()
  })
})

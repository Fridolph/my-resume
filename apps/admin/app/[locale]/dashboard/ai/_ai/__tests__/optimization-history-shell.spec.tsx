'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY,
  RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY,
  createInstructionHash,
} from '../utils/resume-optimization-persistence'

const {
  useAdminSessionMock,
  fetchOptimizationResultMock,
  fetchUsageRecordDetailMock,
  pushMock,
} = vi.hoisted(() => ({
  useAdminSessionMock: vi.fn(),
  fetchOptimizationResultMock: vi.fn(),
  fetchUsageRecordDetailMock: vi.fn(),
  pushMock: vi.fn(),
}))

vi.mock('@core/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('alova/client', async () => {
  const React = await import('react')

  return {
    useRequest: (methodHandler: any) => {
      const [loading, setLoading] = React.useState(false)

      const send = React.useCallback(
        async (...args: unknown[]) => {
          setLoading(true)

          try {
            const method =
              typeof methodHandler === 'function' ? methodHandler(...args) : methodHandler
            return await method.send()
          } finally {
            setLoading(false)
          }
        },
        [methodHandler],
      )

      return { loading, send }
    },
  }
})

vi.mock('../services/ai-workbench-api', async () => {
  const actual = await vi.importActual('../services/ai-workbench-api')

  return {
    ...actual,
    createFetchAiResumeOptimizationResultMethod: (input: any) => ({
      send: () => fetchOptimizationResultMock(input),
    }),
    createFetchAiUsageRecordDetailMethod: (input: any) => ({
      send: () => fetchUsageRecordDetailMock(input.recordId),
    }),
  }
})

import { AdminAiOptimizationHistoryShell } from '../optimization-history-shell'

describe('AdminAiOptimizationHistoryShell', () => {
  beforeEach(() => {
    useAdminSessionMock.mockReset()
    fetchOptimizationResultMock.mockReset()
    fetchUsageRecordDetailMock.mockReset()
    pushMock.mockReset()
    if (!Element.prototype.getAnimations) {
      Element.prototype.getAnimations = () => []
    }
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('should render optimization history as table, open drawer and support reuse', async () => {
    const user = userEvent.setup()
    const instruction = `# JS 高级全栈工程师 JD

## 职位概述

我们正在寻找一位经验丰富的高级全栈工程师，加入快速成长的技术团队。`
    const summary = '历史中的 AI 优化结果：突出全栈能力、架构经验与团队协作。'
    const instructionHash = createInstructionHash(instruction)

    window.localStorage.setItem(
      RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          resultId: 'result-history-101',
          usageRecordId: 'usage-optimize-101',
          summary,
          instruction,
          instructionHash,
          locale: 'zh',
          createdAt: '2026-04-15T09:30:00.000Z',
          changedModules: ['profile', 'projects'],
        },
      ]),
    )
    window.localStorage.setItem(
      AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY,
      JSON.stringify({
        [instructionHash]: {
          instructionHash,
          resumeOptimizationUsageRecordId: 'usage-optimize-101',
          analysisUsageRecordIds: {
            'jd-match': 'usage-jd-101',
            'offer-compare': 'usage-offer-101',
          },
          updatedAt: '2026-04-15T09:30:00.000Z',
        },
      }),
    )

    fetchOptimizationResultMock.mockResolvedValue({
      resultId: 'result-history-101',
      locale: 'zh',
      summary: '中文优化摘要',
      focusAreas: ['突出全栈能力', '强调技术领导力'],
      changedModules: ['profile', 'projects'],
      moduleDiffs: [],
      createdAt: '2026-04-15T09:30:00.000Z',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    })
    fetchUsageRecordDetailMock.mockImplementation(async (recordId: string) => ({
      id: recordId,
      operationType: 'analysis-report',
      scenario: recordId.includes('jd') ? 'jd-match' : 'offer-compare',
      locale: 'zh',
      inputPreview: 'NestJS React TypeScript',
      summary: recordId.includes('jd') ? 'JD 匹配摘要' : 'Offer 对比摘要',
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'openai-compatible',
      generator: 'ai-provider',
      status: 'succeeded',
      relatedReportId: `${recordId}-report`,
      relatedResultId: null,
      errorMessage: null,
      durationMs: 1200,
      createdAt: '2026-04-15T10:00:00.000Z',
      detail: {
        reportId: `${recordId}-report`,
        cacheKey: `${recordId}:cache`,
        scenario: recordId.includes('jd') ? 'jd-match' : 'offer-compare',
        locale: 'zh',
        sourceHash: 'hash-demo',
        inputPreview: 'NestJS React TypeScript',
        summary: recordId.includes('jd') ? 'JD 匹配摘要' : 'Offer 对比摘要',
        score: {
          value: 78,
          label: '匹配度良好',
          reason: '当前内容与目标岗位已有较强重合。',
        },
        strengths: ['核心关键词覆盖较好'],
        gaps: ['量化结果还不够'],
        risks: ['若不补成果描述，可信度会下降'],
        suggestions: [],
        sections: [],
        generator: 'ai-provider',
        createdAt: '2026-04-15T10:00:00.000Z',
      },
    }))

    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: {
        id: 'admin-demo-user',
        username: 'admin',
        role: 'admin',
        capabilities: {
          canEditResume: true,
          canPublishResume: true,
          canTriggerAiAnalysis: true,
        },
      },
      status: 'ready',
    })

    render(<AdminAiOptimizationHistoryShell locale="zh" />)

    expect(await screen.findByRole('heading', { name: '优化记录' })).toBeInTheDocument()
    expect(screen.getByTestId('ai-optimization-archive-page')).toBeInTheDocument()
    expect(screen.getByTestId('optimization-history-overview-grid')).toHaveClass(
      'md:grid-cols-3',
    )
    expect(screen.getAllByTestId('optimization-history-overview-card')).toHaveLength(3)
    const actionBar = screen.getByTestId('optimization-history-actions')
    const backButton = screen.getByRole('button', { name: '返回 AI 工作台' })
    const refreshButton = screen.getByRole('button', { name: '刷新记录' })
    expect(backButton).toHaveClass('h-10', 'rounded-full')
    expect(refreshButton).toHaveClass('h-10', 'rounded-full')
    expect(actionBar).toContainElement(backButton)
    expect(actionBar).toContainElement(refreshButton)
    await user.click(backButton)
    expect(pushMock).toHaveBeenCalledWith('/dashboard/ai')
    const historyTable = screen.getByRole('grid', { name: '优化记录中心表格' })
    expect(historyTable).toBeInTheDocument()
    expect(historyTable).not.toHaveClass('min-w-[1180px]')
    expect(screen.getByTestId('optimization-history-pagination')).toBeInTheDocument()
    expect(screen.getByTestId('optimization-history-pagination-summary')).toHaveTextContent(
      '第 1-1 条，共 1 条',
    )
    expect(screen.getByText('JS 高级全栈工程师 JD')).toBeInTheDocument()
    expect(screen.queryByText('职位概述')).not.toBeInTheDocument()
    expect(screen.getAllByText(summary).length).toBeGreaterThan(0)
    expect(screen.getByText('已含 Offer 对比')).toBeInTheDocument()
    expect(screen.getByText('JD 匹配分析')).toBeInTheDocument()
    expect(screen.getByText('Offer 对比建议')).toBeInTheDocument()
    expect(screen.queryByText('回填到输入区')).not.toBeInTheDocument()
    expect(screen.queryByText('缓存报告与预设体验')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '查看原文' }))
    expect(
      await screen.findByRole('dialog', { name: 'JS 高级全栈工程师 JD' }),
    ).toBeInTheDocument()
    expect(
      screen.getByTestId('optimization-history-summary-modal-body'),
    ).toHaveTextContent(summary)
    expect(
      screen.queryByText((content) => content.includes('我们正在寻找一位经验丰富的高级全栈工程师')),
    ).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '关闭' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'JS 高级全栈工程师 JD' }),
      ).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '查看详情' }))

    expect(
      await screen.findByRole('dialog', { name: '优化记录详情' }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText((content) => content.includes('已关联 2/3 个分析场景')),
    ).toBeInTheDocument()
    expect(await screen.findByText('中文优化摘要')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '打开结果页' })).toHaveAttribute(
      'href',
      '/dashboard/ai/resume-optimization/results/result-history-101',
    )

    await user.click(screen.getByRole('tab', { name: 'JD 匹配分析' }))
    expect(await screen.findByText('JD 匹配摘要')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: '简历评审分析' }))
    expect(
      await screen.findByText('该条优化记录下暂无此分析场景记录。'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '关闭详情' }))
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: '优化记录详情' })).not.toBeInTheDocument()
    })

    await waitFor(() => {
      expect(fetchOptimizationResultMock).toHaveBeenCalledWith({
        accessToken: 'admin-token',
        apiBaseUrl: 'http://localhost:5577',
        locale: 'zh',
        resultId: 'result-history-101',
      })
    })
  })

  it('should keep drawer readable when optimization result cache is missing', async () => {
    const user = userEvent.setup()
    const instruction = `# JS 高级全栈工程师 JD

请根据这份 JD 优化当前简历。`
    const instructionHash = createInstructionHash(instruction)

    window.localStorage.setItem(
      RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          resultId: 'expired-result-202',
          usageRecordId: 'usage-optimize-202',
          summary: '本地保留的优化摘要',
          instruction,
          instructionHash,
          locale: 'zh',
          createdAt: '2026-04-15T09:30:00.000Z',
          changedModules: ['profile', 'projects'],
        },
      ]),
    )
    window.localStorage.setItem(
      AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY,
      JSON.stringify({
        [instructionHash]: {
          instructionHash,
          resumeOptimizationUsageRecordId: 'usage-optimize-202',
          analysisUsageRecordIds: {
            'jd-match': 'usage-jd-202',
          },
          updatedAt: '2026-04-15T09:30:00.000Z',
        },
      }),
    )

    fetchOptimizationResultMock.mockRejectedValue(new Error('Not Found'))
    fetchUsageRecordDetailMock.mockResolvedValue({
      id: 'usage-jd-202',
      operationType: 'analysis-report',
      scenario: 'jd-match',
      locale: 'zh',
      inputPreview: 'NestJS React TypeScript',
      summary: 'JD 匹配摘要',
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'openai-compatible',
      generator: 'ai-provider',
      status: 'succeeded',
      relatedReportId: 'usage-jd-202-report',
      relatedResultId: null,
      errorMessage: null,
      durationMs: 1200,
      createdAt: '2026-04-15T10:00:00.000Z',
      detail: {
        reportId: 'usage-jd-202-report',
        cacheKey: 'usage-jd-202:cache',
        scenario: 'jd-match',
        locale: 'zh',
        sourceHash: 'hash-demo',
        inputPreview: 'NestJS React TypeScript',
        summary: 'JD 匹配摘要',
        score: {
          value: 78,
          label: '匹配度良好',
          reason: '当前内容与目标岗位已有较强重合。',
        },
        strengths: ['核心关键词覆盖较好'],
        gaps: ['量化结果还不够'],
        risks: ['若不补成果描述，可信度会下降'],
        suggestions: [],
        sections: [],
        generator: 'ai-provider',
        createdAt: '2026-04-15T10:00:00.000Z',
      },
    })

    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: {
        id: 'admin-demo-user',
        username: 'admin',
        role: 'admin',
        capabilities: {
          canEditResume: true,
          canPublishResume: true,
          canTriggerAiAnalysis: true,
        },
      },
      status: 'ready',
    })

    render(<AdminAiOptimizationHistoryShell locale="zh" />)

    await user.click(await screen.findByRole('button', { name: '查看详情' }))

    expect(
      await screen.findByRole('dialog', { name: '优化记录详情' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('该条优化结果已失效或不可读取')).toBeInTheDocument()
    expect(
      screen.getByText('本地记录仍可回看；若需重新查看完整优化建议，请返回 AI 工作台重新生成。'),
    ).toBeInTheDocument()
    expect(screen.queryByText('回填到输入区')).not.toBeInTheDocument()
    expect(screen.getAllByText('本地保留的优化摘要').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'JD 匹配分析' }))
    expect(await screen.findByText('JD 匹配摘要')).toBeInTheDocument()
  })

  it('should render detail from usage-record fallback when cache misses', async () => {
    const user = userEvent.setup()
    const instruction = `# 前端负责人 JD

请根据这份 JD 优化当前简历。`
    const instructionHash = createInstructionHash(instruction)

    window.localStorage.setItem(
      RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY,
      JSON.stringify([
        {
          resultId: 'result-fallback-303',
          usageRecordId: 'usage-optimize-303',
          summary: '本地优化摘要（fallback）',
          instruction,
          instructionHash,
          locale: 'zh',
          createdAt: '2026-04-15T09:30:00.000Z',
          changedModules: ['profile'],
        },
      ]),
    )
    window.localStorage.setItem(
      AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY,
      JSON.stringify({
        [instructionHash]: {
          instructionHash,
          resumeOptimizationUsageRecordId: 'usage-optimize-303',
          analysisUsageRecordIds: {},
          updatedAt: '2026-04-15T09:30:00.000Z',
        },
      }),
    )

    fetchOptimizationResultMock.mockResolvedValue({
      resultId: 'result-fallback-303',
      locale: 'zh',
      source: 'usage-record',
      canApply: false,
      summary: '来自 usage-record 的回放摘要',
      focusAreas: ['突出管理与交付'],
      changedModules: ['profile'],
      moduleDiffs: [],
      createdAt: '2026-04-15T09:30:00.000Z',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    })
    fetchUsageRecordDetailMock.mockResolvedValue({
      id: 'unused',
      operationType: 'analysis-report',
      scenario: 'jd-match',
      locale: 'zh',
      inputPreview: '',
      summary: '',
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'openai-compatible',
      generator: 'ai-provider',
      status: 'succeeded',
      relatedReportId: null,
      relatedResultId: null,
      errorMessage: null,
      durationMs: 1200,
      createdAt: '2026-04-15T10:00:00.000Z',
      detail: null,
    })

    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: {
        id: 'admin-demo-user',
        username: 'admin',
        role: 'admin',
        capabilities: {
          canEditResume: true,
          canPublishResume: true,
          canTriggerAiAnalysis: true,
        },
      },
      status: 'ready',
    })

    render(<AdminAiOptimizationHistoryShell locale="zh" />)

    await user.click(await screen.findByRole('button', { name: '查看详情' }))

    expect(
      await screen.findByRole('dialog', { name: '优化记录详情' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('来自 usage-record 的回放摘要')).toBeInTheDocument()
    expect(screen.queryByText('该条优化结果已失效或不可读取')).not.toBeInTheDocument()
  })
})

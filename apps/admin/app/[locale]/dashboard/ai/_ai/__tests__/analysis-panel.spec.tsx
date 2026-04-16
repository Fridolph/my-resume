'use client'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AiAnalysisPanel, buildPendingProgress } from '../components/analysis-panel'
import type { ResumeDraftSummarySnapshot } from '../../../resume/_resume/types/resume.types'
import {
  AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY,
  createInstructionHash,
} from '../utils/resume-optimization-persistence'

const { routerPushMock, fetchUsageHistoryMock, fetchUsageRecordDetailMock } = vi.hoisted(
  () => ({
    routerPushMock: vi.fn(),
    fetchUsageHistoryMock: vi.fn(),
    fetchUsageRecordDetailMock: vi.fn(),
  }),
)

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}))

vi.mock('../components/ai-analysis-history-table', () => ({
  AiAnalysisHistoryTable: ({
    records,
    onOpenDetail,
  }: {
    records: Array<{ id: string; summary: string | null }>
    onOpenDetail: (recordId: string) => void
  }) => (
    <div>
      <span>{`分析记录数：${records.length}`}</span>
      {records.map((record) => (
        <button key={record.id} onClick={() => onOpenDetail(record.id)} type="button">
          {record.summary ?? record.id}
        </button>
      ))}
    </div>
  ),
}))

vi.mock('../components/ai-analysis-report-drawer', () => ({
  AiAnalysisReportDrawer: ({
    isOpen,
    onClose,
    record,
  }: {
    isOpen: boolean
    onClose: () => void
    record: null | { summary: string | null; status: string }
  }) =>
    isOpen ? (
      <div aria-label="AI 辅助分析详情" role="dialog">
        <span>{`drawer:${record?.status}:${record?.summary ?? 'empty'}`}</span>
        <button onClick={onClose} type="button">
          关闭详情
        </button>
        <button type="button">定位到 projects 改写模块</button>
      </div>
    ) : null,
}))

vi.mock('alova/client', async () => {
  const React = await import('react')

  return {
    useRequest: (methodHandler: any) => {
      const [loading, setLoading] = React.useState(false)
      const [error, setError] = React.useState<Error | undefined>(undefined)

      const send = React.useCallback(
        async (...args: unknown[]) => {
          setLoading(true)
          setError(undefined)

          try {
            const method =
              typeof methodHandler === 'function' ? methodHandler(...args) : methodHandler
            return await method.send()
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

      return { error, loading, send }
    },
  }
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

beforeEach(() => {
  routerPushMock.mockReset()
  fetchUsageHistoryMock.mockReset()
  fetchUsageRecordDetailMock.mockReset()
  fetchUsageHistoryMock.mockResolvedValue([])
  fetchUsageRecordDetailMock.mockResolvedValue(null)
})

const runtimeSummary = {
  provider: 'qiniu',
  model: 'deepseek-v3',
  mode: 'live',
  supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'] as const,
}

const draftSummarySnapshot: ResumeDraftSummarySnapshot = {
  status: 'draft',
  updatedAt: '2026-03-31T09:00:00.000Z',
  resume: {
    meta: {
      slug: 'standard-resume',
      defaultLocale: 'zh',
      locale: 'zh',
    },
    profile: {
      headline: '当前草稿标题',
      summary: '当前草稿摘要',
    },
    counts: {
      education: 0,
      experiences: 0,
      projects: 0,
      skills: 0,
      highlights: 0,
    },
  },
}

function ControlledAnalysisPanel(props: {
  canAnalyze: boolean
  createGenerateResumeOptimizationMethod?: typeof import('../services/ai-workbench-api').createGenerateAiResumeOptimizationMethod
  createTriggerAnalysisMethod?: typeof import('../services/ai-workbench-api').createTriggerAiWorkbenchAnalysisMethod
  helperMessage?: string | null
  initialContent?: string
  inputAccessory?: ReactNode
}) {
  const [content, setContent] = useState(props.initialContent ?? '')

  return (
    <AiAnalysisPanel
      accessToken="demo-token"
      apiBaseUrl="http://localhost:5577"
      canAnalyze={props.canAnalyze}
      content={content}
      createFetchUsageHistoryMethod={
        vi.fn((input) => ({
          send: () => fetchUsageHistoryMock(input),
        })) as any
      }
      createFetchUsageRecordDetailMethod={
        vi.fn((input) => ({
          send: () => fetchUsageRecordDetailMock(input.recordId),
        })) as any
      }
      createGenerateResumeOptimizationMethod={
        props.createGenerateResumeOptimizationMethod
      }
      createTriggerAnalysisMethod={props.createTriggerAnalysisMethod}
      draftSnapshot={draftSummarySnapshot}
      helperMessage={props.helperMessage}
      inputAccessory={props.inputAccessory}
      onContentChange={setContent}
      runtimeSummary={runtimeSummary}
    />
  )
}

describe('AiAnalysisPanel', () => {
  it('should compute pending progress with slower growth and completion cap', () => {
    expect(buildPendingProgress(0)).toBe(0)
    expect(buildPendingProgress(5)).toBe(7)
    expect(buildPendingProgress(6)).toBe(9)
    expect(buildPendingProgress(10)).toBe(15)
    expect(buildPendingProgress(15)).toBe(24)
    expect(buildPendingProgress(20)).toBe(36)
    expect(buildPendingProgress(25)).toBe(51)
    expect(buildPendingProgress(30)).toBe(70)
    expect(buildPendingProgress(35)).toBe(75)
    expect(buildPendingProgress(55)).toBe(95)
    expect(buildPendingProgress(90)).toBe(95)
    expect(buildPendingProgress(12, true)).toBe(100)
  })

  it('should show read-only message when current role cannot trigger analysis', () => {
    render(<ControlledAnalysisPanel canAnalyze={false} />)

    expect(screen.getByText('当前角色只读')).toBeInTheDocument()
    expect(
      screen.getByText(
        'viewer 当前只保留缓存报告体验。当前草稿优化、真实分析与草稿回写入口只在管理员链路中开放。',
      ),
    ).toBeInTheDocument()
  })

  it('should trigger live analysis, refresh history and open drawer', async () => {
    const user = userEvent.setup()
    const triggerAnalysis = vi.fn().mockResolvedValue({
      cached: false,
      usageRecordId: 'usage-report-001',
      report: {
        reportId: 'resume-review-demo',
        cacheKey: 'resume-review:zh:demo',
        scenario: 'resume-review',
        locale: 'zh',
        sourceHash: 'demo',
        inputPreview: 'NestJS React TypeScript',
        summary: '建议继续补充量化结果与职责边界。',
        score: {
          value: 76,
          label: '基础匹配良好',
          reason: '已有核心技术关键词，但成果与职责边界仍需补强。',
        },
        strengths: ['已覆盖 NestJS、React、TypeScript 等岗位基础关键词。'],
        gaps: ['缺少体现业务结果的量化成果。'],
        risks: ['如果没有主导范围说明，容易被理解为参与而非负责。'],
        suggestions: [
          {
            key: 'experience-impact',
            title: '补强经历成果描述',
            module: 'experiences',
            reason: '工作经历是最能证明能力与影响范围的模块。',
            actions: ['补一条量化结果', '补一条主导职责描述'],
          },
        ],
        sections: [
          {
            key: 'analysis-result',
            title: '分析结果',
            bullets: ['补充量化成果。', '突出主导模块。'],
          },
        ],
        generator: 'ai-provider',
        createdAt: '2026-03-27T00:00:00.000Z',
      },
    })
    const createTriggerAnalysisMethod = vi.fn((input) => ({
      send: () => triggerAnalysis(input),
    }))

    render(
      <ControlledAnalysisPanel
        canAnalyze
        helperMessage="已将 resume.pdf 的提取结果同步到优化要求输入区，可直接整理后分析当前草稿。"
        initialContent="NestJS React TypeScript"
        createTriggerAnalysisMethod={createTriggerAnalysisMethod as any}
      />,
    )

    await user.click(screen.getByRole('button', { name: '生成辅助分析报告' }))

    await waitFor(() => {
      expect(triggerAnalysis).toHaveBeenCalledWith({
        accessToken: 'demo-token',
        apiBaseUrl: 'http://localhost:5577',
        scenario: 'resume-review',
        locale: 'zh',
        content: 'NestJS React TypeScript',
      })
    })

    expect(
      await screen.findByText('drawer:succeeded:建议继续补充量化结果与职责边界。'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'AI 辅助分析详情' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: '关闭详情' }))
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'AI 辅助分析详情' }),
      ).not.toBeInTheDocument()
    })
    expect(fetchUsageHistoryMock).toHaveBeenCalled()
    expect(
      JSON.parse(
        window.localStorage.getItem(AI_WORKBENCH_RELATION_INDEX_STORAGE_KEY) ?? '{}',
      ),
    ).toMatchObject({
      [createInstructionHash('NestJS React TypeScript')]: {
        analysisUsageRecordIds: {
          'resume-review': 'usage-report-001',
        },
      },
    })
  }, 15000)

  it('should guard against empty input before triggering analysis', async () => {
    const user = userEvent.setup()
    const triggerAnalysis = vi.fn()

    render(
      <ControlledAnalysisPanel
        canAnalyze
        createTriggerAnalysisMethod={vi.fn((input) => ({
          send: () => triggerAnalysis(input),
        })) as any}
      />,
    )

    await user.click(screen.getByRole('button', { name: '生成辅助分析报告' }))

    expect(
      await screen.findByText('请先输入 JD、目标岗位或分析要求，再生成辅助分析报告。'),
    ).toBeInTheDocument()
    expect(triggerAnalysis).not.toHaveBeenCalled()
  })

  it('should keep input accessory form outside analysis form to avoid nested forms', () => {
    const { container } = render(
      <ControlledAnalysisPanel
        canAnalyze
        inputAccessory={
          <form aria-label="文件提取表单">
            <button type="submit">提交文件提取</button>
          </form>
        }
        initialContent="NestJS React TypeScript"
      />,
    )

    expect(container.querySelectorAll('form form')).toHaveLength(0)
    expect(screen.getByRole('form', { name: '文件提取表单' })).toBeInTheDocument()
  })

  it('should render history error without throwing runtime error', async () => {
    fetchUsageHistoryMock.mockRejectedValue(new Error('Internal server error'))

    render(<ControlledAnalysisPanel canAnalyze initialContent="NestJS React TypeScript" />)

    expect(
      await screen.findByText(
        'AI 调用记录加载失败：Internal server error。请确认服务端数据库已执行 db:push。',
      ),
    ).toBeInTheDocument()
  })

  it('should allow opening history detail and linking to result page after result exists', async () => {
    fetchUsageHistoryMock.mockResolvedValue([
      {
        id: 'usage-history-001',
        operationType: 'analysis-report',
        scenario: 'resume-review',
        locale: 'zh',
        inputPreview: 'NestJS React TypeScript',
        summary: '历史报告摘要',
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'live',
        generator: 'ai-provider',
        status: 'succeeded',
        relatedReportId: 'report-history-001',
        relatedResultId: null,
        errorMessage: null,
        durationMs: 1200,
        createdAt: '2026-04-15T10:00:00.000Z',
        scoreLabel: '基础匹配良好',
        scoreValue: 76,
      },
    ])
    fetchUsageRecordDetailMock.mockResolvedValue({
      id: 'usage-history-001',
      operationType: 'analysis-report',
      scenario: 'resume-review',
      locale: 'zh',
      inputPreview: 'NestJS React TypeScript',
      summary: '历史报告摘要',
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'live',
      generator: 'ai-provider',
      status: 'succeeded',
      relatedReportId: 'report-history-001',
      relatedResultId: null,
      errorMessage: null,
      durationMs: 1200,
      createdAt: '2026-04-15T10:00:00.000Z',
      detail: {
        reportId: 'report-history-001',
        summary: '历史报告摘要',
      },
    })
    const generateResumeOptimization = vi.fn().mockResolvedValue({
      resultId: 'result-demo-001',
      locale: 'zh',
      summary: '已生成结构化建议稿',
      focusAreas: ['强化摘要'],
      changedModules: ['profile'],
      moduleDiffs: [],
      createdAt: '2026-03-30T00:00:00.000Z',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    })
    const createGenerateResumeOptimizationMethod = vi.fn((input) => ({
      send: () => generateResumeOptimization(input),
    }))

    render(
      <ControlledAnalysisPanel
        canAnalyze
        createGenerateResumeOptimizationMethod={
          createGenerateResumeOptimizationMethod as any
        }
        initialContent="请根据 React 和 Next.js 岗位优化当前简历"
      />,
    )

    expect(await screen.findByText('分析记录数：1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '历史报告摘要' }))
    expect(await screen.findByText('drawer:succeeded:历史报告摘要')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'AI 辅助分析详情' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '分析当前草稿并生成建议' }))
    expect(await screen.findByText('分析完成，正在进入结果页')).toBeInTheDocument()
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '100',
    )

    await waitFor(
      () => {
        expect(routerPushMock).toHaveBeenCalledWith(
          '/dashboard/ai/resume-optimization/results/result-demo-001',
        )
      },
      { timeout: 1500 },
    )
  })

  it('should still navigate to result page when history refresh fails after optimization', async () => {
    fetchUsageHistoryMock.mockRejectedValue(new Error('Internal server error'))
    const generateResumeOptimization = vi.fn().mockResolvedValue({
      resultId: 'result-demo-002',
      locale: 'zh',
      summary: '已生成结构化建议稿',
      focusAreas: ['强化摘要'],
      changedModules: ['profile'],
      moduleDiffs: [],
      createdAt: '2026-03-30T00:00:00.000Z',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    })
    const createGenerateResumeOptimizationMethod = vi.fn((input) => ({
      send: () => generateResumeOptimization(input),
    }))

    render(
      <ControlledAnalysisPanel
        canAnalyze
        createGenerateResumeOptimizationMethod={
          createGenerateResumeOptimizationMethod as any
        }
        initialContent="请根据 React 和 Next.js 岗位优化当前简历"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '分析当前草稿并生成建议' }))
    expect(await screen.findByText('分析完成，正在进入结果页')).toBeInTheDocument()

    await waitFor(
      () => {
        expect(routerPushMock).toHaveBeenCalledWith(
          '/dashboard/ai/resume-optimization/results/result-demo-002',
        )
      },
      { timeout: 1500 },
    )
    expect(
      await screen.findByText(
        'AI 调用记录加载失败：Internal server error。请确认服务端数据库已执行 db:push。',
      ),
    ).toBeInTheDocument()
  })

  it('should show rich pending overlay and allow cancelling optimization', async () => {
    vi.useFakeTimers()

    const generateResumeOptimization = vi.fn().mockImplementation(
      ({
        requestInit,
      }: {
        requestInit?: {
          signal?: AbortSignal
        }
      }) =>
        new Promise((_, reject) => {
          requestInit?.signal?.addEventListener('abort', () => {
            const abortError = new Error('Aborted')
            abortError.name = 'AbortError'
            reject(abortError)
          })
        }),
    )
    const createGenerateResumeOptimizationMethod = vi.fn((input) => ({
      send: () => generateResumeOptimization(input),
    }))

    render(
      <ControlledAnalysisPanel
        canAnalyze
        createGenerateResumeOptimizationMethod={
          createGenerateResumeOptimizationMethod as any
        }
        initialContent="请根据高级全栈 JD 优化当前简历"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: '分析当前草稿并生成建议' }))

    expect(screen.getByTestId('resume-optimization-pending-overlay')).toBeInTheDocument()
    expect(screen.getByTestId('resume-optimization-pending-card')).toBeInTheDocument()
    expect(screen.getByText('正在分析当前草稿')).toBeInTheDocument()
    expect(screen.getByText('模拟进度')).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '0',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '7',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '15',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '24',
    )
    expect(
      screen.getByText('模型仍在处理中，请继续等待；建议保持当前页面开启。'),
    ).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '36',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '51',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByText('已等待 30s')).toBeInTheDocument()
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '70',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000)
    })
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '75',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20_000)
    })
    expect(screen.getByText('已等待 55s')).toBeInTheDocument()
    expect(screen.getByText('95%')).toBeInTheDocument()
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '95',
    )

    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000)
    })
    expect(screen.getByTestId('resume-optimization-pending-progress')).toHaveAttribute(
      'data-progress-value',
      '95',
    )

    fireEvent.click(screen.getByRole('button', { name: '取消本次分析' }))
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.queryByText('分析完成，正在进入结果页')).not.toBeInTheDocument()
    expect(screen.getByText('已取消本次分析，可继续调整要求后重新生成。')).toBeInTheDocument()
  })
})

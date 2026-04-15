'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResumeDraftSnapshot } from '../../../resume/_resume/types/resume.types'
import {
  RESUME_OPTIMIZATION_CONTENT_STORAGE_KEY,
  RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY,
  createInstructionHash,
} from '../utils/resume-optimization-persistence'

const {
  useAdminSessionMock,
  fetchAiWorkbenchRuntimeMock,
  fetchDraftResumeSummaryMock,
  fetchCachedAiWorkbenchReportMock,
  fetchCachedAiWorkbenchReportsMock,
} = vi.hoisted(() => ({
  useAdminSessionMock: vi.fn(),
  fetchAiWorkbenchRuntimeMock: vi.fn(),
  fetchDraftResumeSummaryMock: vi.fn(),
  fetchCachedAiWorkbenchReportMock: vi.fn(),
  fetchCachedAiWorkbenchReportsMock: vi.fn(),
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

vi.mock('../services/ai-workbench-api', () => ({
  createFetchAiWorkbenchRuntimeMethod: (input: any) => ({
    send: () => fetchAiWorkbenchRuntimeMock(input),
  }),
  createFetchCachedAiWorkbenchReportMethod: (input: any) => ({
    send: () => fetchCachedAiWorkbenchReportMock(input),
  }),
  createFetchCachedAiWorkbenchReportsMethod: (input: any) => ({
    send: () => fetchCachedAiWorkbenchReportsMock(input),
  }),
}))

vi.mock('../../../resume/_resume/services/resume-draft-api', () => ({
  createFetchDraftResumeSummaryMethod: (input: any) => ({
    send: () => fetchDraftResumeSummaryMock(input),
  }),
}))

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string => {
      const map: Record<string, string> = {
        pageDescription:
          '这一页先把“当前草稿优化”收口为 AI 主路径，再把文件提取、辅助分析报告、缓存回看与草稿回写整理成稳定工作台。',
        pageTitle: 'AI 工作台',
      }

      return map[key] ?? key
    },
}))

vi.mock('../components/file-extraction-panel', () => ({
  AiFileExtractionPanel: ({
    canUpload,
    onExtractedText,
  }: {
    canUpload: boolean
    onExtractedText?: (result: {
      fileName: string
      fileType: 'txt'
      mimeType: string
      text: string
      charCount: number
    }) => void
  }) =>
    canUpload ? (
      <div>
        <span>文件提取面板占位</span>
        <button
          onClick={() =>
            onExtractedText?.({
              fileName: 'resume.txt',
              fileType: 'txt',
              mimeType: 'text/plain',
              text: 'resume text content',
              charCount: 19,
            })
          }
          type="button">
          模拟提取完成
        </button>
      </div>
    ) : (
      <div>文件提取只读占位</div>
    ),
}))

vi.mock('../components/analysis-panel', () => ({
  AiAnalysisPanel: ({
    canAnalyze,
    content,
    draftSnapshot,
    inputAccessory,
    onDraftApplied,
    onOptimizationGenerated,
  }: {
    canAnalyze: boolean
    content: string
    draftSnapshot?: {
      resume: {
        profile: {
          headline: string
        }
      }
    } | null
    inputAccessory?: ReactNode
    onDraftApplied?: (snapshot: ResumeDraftSnapshot) => void
    onOptimizationGenerated?: (
      result: {
        resultId: string
        locale: 'zh' | 'en'
        summary: string
        focusAreas: string[]
        changedModules: ('profile' | 'experiences' | 'projects' | 'highlights')[]
        moduleDiffs: []
        createdAt: string
        providerSummary: {
          provider: string
          model: string
          mode: string
        }
      },
      instruction: string,
    ) => void
  }) => (
    <div>
      {inputAccessory}
      <span>{canAnalyze ? '真实分析面板占位' : '真实分析只读占位'}</span>
      <span>{`当前优化要求：${content || '空'}`}</span>
      <span>{`当前草稿基线：${draftSnapshot?.resume.profile.headline ?? '空'}`}</span>
      {canAnalyze ? (
        <button
          onClick={() =>
            onDraftApplied?.({
              status: 'draft',
              updatedAt: '2026-03-31T10:00:00.000Z',
              resume: {
                meta: {
                  slug: 'standard-resume',
                  version: 1,
                  defaultLocale: 'zh',
                  locales: ['zh', 'en'],
                },
                profile: {
                  fullName: {
                    zh: '付寅生',
                    en: 'Yinsheng Fu',
                  },
                  headline: {
                    zh: 'AI 优化后标题',
                    en: 'AI Optimized Headline',
                  },
                  summary: {
                    zh: 'AI 优化后的中文摘要',
                    en: 'AI optimized English summary',
                  },
                  location: {
                    zh: '上海',
                    en: 'Shanghai',
                  },
                  email: 'demo@example.com',
                  phone: '+86 13800000000',
                  website: 'https://example.com',
                  hero: {
                    frontImageUrl: '/img/avatar.jpg',
                    backImageUrl: '/img/avatar2.jpg',
                    linkUrl: 'https://github.com/Fridolph/my-resume',
                    slogans: [],
                  },
                  links: [],
                  interests: [],
                },
                education: [],
                experiences: [],
                projects: [],
                skills: [],
                highlights: [],
              },
            })
          }
          type="button">
          模拟应用草稿
        </button>
      ) : null}
      {canAnalyze ? (
        <button
          onClick={() =>
            onOptimizationGenerated?.(
              {
                resultId: 'result-history-001',
                locale: 'zh',
                summary: '历史中的 AI 优化结果',
                focusAreas: ['摘要优化'],
                changedModules: ['profile', 'projects'],
                moduleDiffs: [],
                createdAt: '2026-04-15T08:00:00.000Z',
                providerSummary: {
                  provider: 'qiniu',
                  model: 'deepseek-v3',
                  mode: 'openai-compatible',
                },
              },
              content,
            )
          }
          type="button">
          模拟生成结构化建议完成
        </button>
      ) : null}
    </div>
  ),
}))

import { AdminAiWorkbenchShell } from '../ai-workbench-shell'

const runtimeSummary = {
  provider: 'qiniu',
  model: 'deepseek-v3',
  mode: 'live',
  supportedScenarios: ['jd-match', 'resume-review', 'offer-compare'] as const,
}

const draftSnapshot = {
  status: 'draft' as const,
  updatedAt: '2026-03-31T09:00:00.000Z',
  resume: {
    meta: {
      slug: 'standard-resume' as const,
      defaultLocale: 'zh' as const,
      locale: 'zh' as const,
    },
    profile: {
      headline: '当前草稿标题',
      summary: '当前草稿摘要',
    },
    counts: {
      education: 1,
      experiences: 2,
      projects: 3,
      skills: 4,
      highlights: 5,
    },
  },
}

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

describe('AdminAiWorkbenchShell', () => {
  beforeEach(() => {
    useAdminSessionMock.mockReset()
    fetchAiWorkbenchRuntimeMock.mockReset()
    fetchDraftResumeSummaryMock.mockReset()
    fetchCachedAiWorkbenchReportMock.mockReset()
    fetchCachedAiWorkbenchReportsMock.mockReset()
    fetchCachedAiWorkbenchReportsMock.mockResolvedValue([])
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
  })

  it('should render runtime summary and scenario cards for admin', async () => {
    const user = userEvent.setup()
    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: adminUser,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    })
    fetchAiWorkbenchRuntimeMock.mockResolvedValue(runtimeSummary)
    fetchDraftResumeSummaryMock.mockResolvedValue(draftSnapshot)

    render(<AdminAiWorkbenchShell locale="zh" />)

    expect(await screen.findByRole('heading', { name: 'AI 工作台' })).toBeInTheDocument()
    expect(screen.getByText('当前 Provider：qiniu')).toBeInTheDocument()
    expect(screen.getByText('当前模型：deepseek-v3')).toBeInTheDocument()
    expect(screen.getByText('运行模式：live')).toBeInTheDocument()
    expect(screen.getByText('JD 匹配分析')).toBeInTheDocument()
    expect(screen.getByText('简历优化建议')).toBeInTheDocument()
    expect(screen.getByText('Offer 对比建议')).toBeInTheDocument()
    expect(
      screen.getByText('当前账号可直接分析当前草稿、查看 diff，并按模块写回后台草稿。'),
    ).toBeInTheDocument()
    expect(await screen.findByText('文件提取面板占位')).toBeInTheDocument()
    expect(await screen.findByText('真实分析面板占位')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入优化记录' })).toHaveAttribute(
      'href',
      '/dashboard/ai/optimization-history',
    )
    expect(screen.queryByText('缓存报告与预设体验')).not.toBeInTheDocument()
    expect(screen.queryByText('最近优化记录')).not.toBeInTheDocument()
    expect(
      screen.getByText((content) =>
        content.startsWith('当前优化要求：# JS 高级全栈工程师 JD'),
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByText((content) => content.startsWith('当前草稿基线：当前草稿标题')),
    ).toBeInTheDocument()
    expect(await screen.findByTestId('compact-workbench-info-cards')).toBeInTheDocument()
    expect(screen.getByText('草稿反馈')).toBeInTheDocument()
    expect(screen.getByText('运行时摘要')).toBeInTheDocument()
    expect(screen.getByText((content) => content.startsWith('当前草稿标题'))).toBeInTheDocument()
    expect(screen.queryByText('当前草稿快照')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '模拟提取完成' }))

    expect(screen.getByText('当前优化要求：resume text content')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '恢复默认 JD 模板' }))

    expect(
      screen.getByText((content) =>
        content.startsWith('当前优化要求：# JS 高级全栈工程师 JD'),
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '模拟生成结构化建议完成' }))

    const storedHistory = JSON.parse(
      window.localStorage.getItem(RESUME_OPTIMIZATION_HISTORY_STORAGE_KEY) ?? '[]',
    )

    expect(storedHistory).toHaveLength(1)
    expect(storedHistory[0]).toEqual(
      expect.objectContaining({
        resultId: 'result-history-001',
        instructionHash: createInstructionHash(storedHistory[0].instruction),
      }),
    )

    await user.click(screen.getByRole('button', { name: '模拟应用草稿' }))

    expect(
      await screen.findByText((content) => content.startsWith('AI 优化后标题')),
    ).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: '展开' })[0]!)
    expect(screen.getByText('AI 优化后的中文摘要')).toBeInTheDocument()
    await waitFor(() => {
      expect(fetchAiWorkbenchRuntimeMock).toHaveBeenCalledTimes(1)
      expect(fetchDraftResumeSummaryMock).toHaveBeenCalledTimes(1)
      expect(fetchCachedAiWorkbenchReportsMock).not.toHaveBeenCalled()
      expect(fetchCachedAiWorkbenchReportMock).not.toHaveBeenCalled()
    })
  }, 10000)

  it('should render viewer-specific read-only guidance', async () => {
    cleanup()

    useAdminSessionMock.mockReturnValue({
      accessToken: 'viewer-token',
      currentUser: viewerUser,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    })
    fetchAiWorkbenchRuntimeMock.mockResolvedValue(runtimeSummary)

    render(
      <StrictMode>
        <AdminAiWorkbenchShell locale="zh" />
      </StrictMode>,
    )

    expect(await screen.findByText('当前账号：viewer')).toBeInTheDocument()
    expect(
      screen.getByText(
        'viewer 当前只允许查看缓存结果与预设体验，不能分析当前草稿或触发新的真实分析。',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '进入优化记录' })).toHaveAttribute(
      'href',
      '/dashboard/ai/optimization-history',
    )
    expect(screen.queryByText('缓存报告与预设体验')).not.toBeInTheDocument()
    expect(await screen.findByText('文件提取只读占位')).toBeInTheDocument()
    expect(await screen.findByText('真实分析只读占位')).toBeInTheDocument()
    expect(fetchDraftResumeSummaryMock).not.toHaveBeenCalled()
  })

  it('should load persisted content from local storage', async () => {
    window.localStorage.setItem(
      RESUME_OPTIMIZATION_CONTENT_STORAGE_KEY,
      '已保存的自定义 JD',
    )

    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: adminUser,
      logout: vi.fn(),
      refreshSession: vi.fn(),
      status: 'ready',
    })
    fetchAiWorkbenchRuntimeMock.mockResolvedValue(runtimeSummary)
    fetchDraftResumeSummaryMock.mockResolvedValue(draftSnapshot)

    render(<AdminAiWorkbenchShell locale="zh" />)

    expect(await screen.findByText('当前优化要求：已保存的自定义 JD')).toBeInTheDocument()
  })
})

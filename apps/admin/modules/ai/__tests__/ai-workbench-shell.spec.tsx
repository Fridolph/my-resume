'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ResumeDraftSnapshot } from '../../resume/types/resume.types'

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

vi.mock('../../../core/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('../services/ai-workbench-api', () => ({
  fetchAiWorkbenchRuntime: fetchAiWorkbenchRuntimeMock,
  fetchCachedAiWorkbenchReport: fetchCachedAiWorkbenchReportMock,
  fetchCachedAiWorkbenchReports: fetchCachedAiWorkbenchReportsMock,
}))

vi.mock('../../resume/services/resume-draft-api', () => ({
  fetchDraftResumeSummary: fetchDraftResumeSummaryMock,
}))

vi.mock('next-intl', () => ({
  useTranslations:
    () =>
    (key: string): string => {
      const map: Record<string, string> = {
        pageDescription:
          '这一页先把上传、分析、缓存报告、草稿回写与运行时状态整理为稳定工作台。',
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
    inputAccessory,
    onDraftApplied,
  }: {
    canAnalyze: boolean
    content: string
    inputAccessory?: ReactNode
    onDraftApplied?: (snapshot: ResumeDraftSnapshot) => void
  }) => (
    <div>
      {inputAccessory}
      <span>{canAnalyze ? '真实分析面板占位' : '真实分析只读占位'}</span>
      <span>{`当前分析内容：${content || '空'}`}</span>
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
    </div>
  ),
}))

import { AdminAiWorkbenchShell } from '../ai-workbench-shell'
import { resetAdminResourceStore } from '../../../core/admin-resource-store'

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
    resetAdminResourceStore()
    useAdminSessionMock.mockReset()
    fetchAiWorkbenchRuntimeMock.mockReset()
    fetchDraftResumeSummaryMock.mockReset()
    fetchCachedAiWorkbenchReportMock.mockReset()
    fetchCachedAiWorkbenchReportsMock.mockReset()
    fetchCachedAiWorkbenchReportsMock.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
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

    render(
      <StrictMode>
        <AdminAiWorkbenchShell locale="zh" />
      </StrictMode>,
    )

    expect(await screen.findByRole('heading', { name: 'AI 工作台' })).toBeInTheDocument()
    expect(screen.getByText('当前 Provider：qiniu')).toBeInTheDocument()
    expect(screen.getByText('当前模型：deepseek-v3')).toBeInTheDocument()
    expect(screen.getByText('运行模式：live')).toBeInTheDocument()
    expect(screen.getByText('JD 匹配分析')).toBeInTheDocument()
    expect(screen.getByText('简历优化建议')).toBeInTheDocument()
    expect(screen.getByText('Offer 对比建议')).toBeInTheDocument()
    expect(
      screen.getByText('当前账号可继续接入上传、真实分析和结果阅读。'),
    ).toBeInTheDocument()
    expect(await screen.findByText('文件提取面板占位')).toBeInTheDocument()
    expect(await screen.findByText('真实分析面板占位')).toBeInTheDocument()
    expect(
      await screen.findByText('缓存报告与预设体验', undefined, { timeout: 4000 }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('admin 也可在这里回看缓存或预设结果，用于对照真实分析输出。'),
    ).toBeInTheDocument()
    expect(await screen.findByText('当前还没有可阅读的缓存报告。')).toBeInTheDocument()
    expect(screen.getByText('当前分析内容：空')).toBeInTheDocument()
    expect(await screen.findByText('当前草稿快照')).toBeInTheDocument()
    expect(screen.getByText('当前草稿标题')).toBeInTheDocument()
    expect(screen.getByText('当前草稿摘要')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '模拟提取完成' }))

    expect(screen.getByText('当前分析内容：resume text content')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '模拟应用草稿' }))

    expect(await screen.findByText('AI 优化后标题')).toBeInTheDocument()
    expect(screen.getByText('AI 优化后的中文摘要')).toBeInTheDocument()
    await waitFor(() => {
      expect(fetchAiWorkbenchRuntimeMock).toHaveBeenCalledTimes(1)
      expect(fetchDraftResumeSummaryMock).toHaveBeenCalledTimes(1)
      expect(fetchCachedAiWorkbenchReportsMock).toHaveBeenCalledTimes(1)
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
        'viewer 当前只允许查看缓存结果与预设体验，不能上传文件或触发真实分析。',
      ),
    ).toBeInTheDocument()
    expect(await screen.findByText('缓存报告与预设体验')).toBeInTheDocument()
    expect(
      screen.getByText(
        'viewer 当前只读取缓存或预设分析结果，不能上传文件，也不能触发新的真实分析请求。',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('当前还没有可阅读的缓存报告。')).toBeInTheDocument()
    expect(await screen.findByText('文件提取只读占位')).toBeInTheDocument()
    expect(await screen.findByText('真实分析只读占位')).toBeInTheDocument()
    expect(fetchDraftResumeSummaryMock).not.toHaveBeenCalled()
  })
})

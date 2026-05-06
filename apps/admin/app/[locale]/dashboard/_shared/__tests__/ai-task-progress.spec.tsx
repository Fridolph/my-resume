'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { AiResumeImportJob } from '../../ai/_ai/types/ai-workbench.types'

const { fetchJobMock, pushMock, streamJobMock } = vi.hoisted(() => ({
  fetchJobMock: vi.fn(),
  pushMock: vi.fn(),
  streamJobMock: vi.fn(),
}))

vi.mock('@i18n/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

vi.mock('../../ai/_ai/services/ai-workbench-api', () => ({
  createFetchAiResumeImportJobMethod: (input: unknown) => ({
    send: () => fetchJobMock(input),
  }),
  streamAiResumeImportJob: (...args: unknown[]) => streamJobMock(...args),
}))

import {
  ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY,
  AiTaskProgressProvider,
} from '../components/ai-task-progress'

function createRunningJob(overrides: Partial<AiResumeImportJob> = {}): AiResumeImportJob {
  return {
    jobId: 'resume-import-job-001',
    status: 'running',
    currentStage: 'ai_generating',
    steps: [
      {
        stage: 'accepted',
        label: '已接收上传请求',
        status: 'completed',
        summary: 'lifeiyu-mock-zh.md · 11.4 KB',
      },
      {
        stage: 'ai_generating',
        label: '正在调用 AI 生成候选草稿',
        status: 'running',
        summary: '模型正在生成候选草稿',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    elapsedMs: 1000,
    ...overrides,
  }
}

function renderProvider(children: ReactNode = <div>页面内容</div>) {
  return render(
    <AiTaskProgressProvider accessToken="admin-token">{children}</AiTaskProgressProvider>,
  )
}

describe('AiTaskProgressProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    fetchJobMock.mockReset()
    pushMock.mockReset()
    streamJobMock.mockReset()
    streamJobMock.mockImplementation((_input, handlers) => {
      handlers.onHeartbeat?.({
        jobId: 'resume-import-job-001',
        timestamp: new Date().toISOString(),
      })
      handlers.onProgressHint?.({
        jobId: 'resume-import-job-001',
        message: '正在识别核心项目',
        timestamp: new Date().toISOString(),
      })

      return new Promise(() => undefined)
    })
  })

  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('restores active resume import job and shows floating progress toast', async () => {
    localStorage.setItem(ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY, 'resume-import-job-001')
    fetchJobMock.mockResolvedValue(createRunningJob())

    renderProvider()

    expect(await screen.findByTestId('ai-task-progress-toast')).toBeInTheDocument()
    expect(screen.getByText('简历导入识别')).toBeInTheDocument()
    expect(screen.getByText('正在调用 AI 生成候选草稿')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('正在识别核心项目')).toBeInTheDocument()
    })
    expect(streamJobMock).toHaveBeenCalled()
  })

  it('can collapse to a compact progress badge and expand again', async () => {
    localStorage.setItem(ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY, 'resume-import-job-001')
    fetchJobMock.mockResolvedValue(createRunningJob())
    const user = userEvent.setup()

    renderProvider()

    expect(await screen.findByTestId('ai-task-progress-toast')).toBeInTheDocument()
    expect(screen.getByText('正在调用 AI 生成候选草稿')).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: '缩小' })[0])

    expect(screen.queryByTestId('ai-task-progress-toast')).not.toBeInTheDocument()
    expect(screen.getByTestId('ai-task-progress-mini')).toBeInTheDocument()
    expect(screen.getByText(/\d+%/)).toBeInTheDocument()

    await user.click(screen.getByTestId('ai-task-progress-mini'))

    expect(await screen.findByTestId('ai-task-progress-toast')).toBeInTheDocument()
    expect(screen.getByText('正在调用 AI 生成候选草稿')).toBeInTheDocument()
  })

  it('navigates to result page when restored job completes', async () => {
    localStorage.setItem(ACTIVE_RESUME_IMPORT_JOB_STORAGE_KEY, 'resume-import-job-001')
    fetchJobMock.mockResolvedValue(
      createRunningJob({
        status: 'completed',
        currentStage: 'completed',
        resultId: 'resume-import-result-001',
      }),
    )

    renderProvider()

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith(
        '/dashboard/ai/resume-import/results/resume-import-result-001',
      )
    })
    expect(await screen.findByTestId('ai-task-status-chip-completed')).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})

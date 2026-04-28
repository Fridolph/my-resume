'use client'

import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ResumeImportPanel } from '../components/resume-import-panel'

const { routerPushMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
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

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('ResumeImportPanel', () => {
  it('shows read-only message when current role cannot recognize resumes', () => {
    render(
      <ResumeImportPanel
        accessToken="viewer-token"
        apiBaseUrl="http://localhost:5577"
        canUpload={false}
      />,
    )

    expect(screen.getByText('当前角色只读')).toBeInTheDocument()
    expect(screen.getByText('只有管理员可上传简历并生成候选草稿。')).toBeInTheDocument()
  })

  it('starts a recognition job, renders progress and redirects after completion', async () => {
    const user = userEvent.setup()
    const onRecognized = vi.fn()
    const recognizeResume = vi.fn().mockResolvedValue({
      jobId: 'resume-import-job-001',
      status: 'running',
      currentStage: 'accepted',
      steps: [
        {
          stage: 'accepted',
          label: '已接收上传请求',
          status: 'running',
          summary: 'lifeiyu-mock-zh.md · 11.4 KB',
        },
        {
          stage: 'ai_generating',
          label: '正在调用 AI 生成候选草稿',
          status: 'pending',
        },
      ],
      createdAt: '2026-04-28T12:00:00.000Z',
      updatedAt: '2026-04-28T12:00:00.000Z',
      elapsedMs: 0,
    })
    const fetchJob = vi.fn().mockResolvedValue({
      jobId: 'resume-import-job-001',
      status: 'completed',
      currentStage: 'completed',
      steps: [
        {
          stage: 'accepted',
          label: '已接收上传请求',
          status: 'completed',
          summary: 'lifeiyu-mock-zh.md · 11.4 KB',
          details: ['上传请求已进入后台识别队列。'],
        },
        {
          stage: 'ai_generating',
          label: '正在调用 AI 生成候选草稿',
          status: 'completed',
          summary: 'AI 候选草稿生成完成，用时 3200 ms。',
        },
      ],
      createdAt: '2026-04-28T12:00:00.000Z',
      updatedAt: '2026-04-28T12:00:04.000Z',
      elapsedMs: 4000,
      resultId: 'resume-import-001',
    })
    const createRecognizeResumeImportMethod = vi.fn((input) => ({
      send: () => recognizeResume(input),
    }))
    const createFetchResumeImportJobMethod = vi.fn((input) => ({
      send: () => fetchJob(input),
    }))

    render(
      <ResumeImportPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createFetchResumeImportJobMethod={createFetchResumeImportJobMethod as any}
        createRecognizeResumeImportMethod={createRecognizeResumeImportMethod as any}
        onRecognized={onRecognized}
        elapsedTickMs={1}
        initialPollIntervalMs={1}
        slowPollAfterMs={40}
        slowPollIntervalMs={1}
      />,
    )

    const file = new File(['# 厉飞雨'], 'lifeiyu-mock-zh.md', {
      type: 'text/markdown',
    })

    await user.upload(screen.getByLabelText('选择简历导入文件'), file)
    await user.click(screen.getByRole('button', { name: '上传并启动识别' }))

    expect(await screen.findByTestId('resume-import-job-panel')).toBeInTheDocument()
    expect(screen.getAllByText('已接收上传请求').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('lifeiyu-mock-zh.md · 11.4 KB')).toBeInTheDocument()

    await waitFor(() => {
      expect(fetchJob).toHaveBeenCalledWith({
        accessToken: 'admin-token',
        apiBaseUrl: 'http://localhost:5577',
        jobId: 'resume-import-job-001',
      })
    })
    await waitFor(() => {
      expect(onRecognized).toHaveBeenCalledWith(
        expect.objectContaining({
          resultId: 'resume-import-001',
        }),
      )
    })
    expect(routerPushMock).toHaveBeenCalledWith(
      '/dashboard/ai/resume-import/results/resume-import-001',
    )
    expect(screen.getByText('上传请求已进入后台识别队列。')).toBeInTheDocument()
    expect(screen.getByText('AI 候选草稿生成完成，用时 3200 ms。')).toBeInTheDocument()
  })

  it('updates elapsed time locally and backs off polling after 40 seconds', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-28T12:00:00.000Z'))
    const runningJob = {
      jobId: 'resume-import-job-003',
      status: 'running',
      currentStage: 'ai_generating',
      steps: [
        {
          stage: 'ai_generating',
          label: '正在调用 AI 生成候选草稿',
          status: 'running',
          summary: '模型正在生成候选草稿。',
        },
      ],
      createdAt: '2026-04-28T12:00:00.000Z',
      updatedAt: '2026-04-28T12:00:00.000Z',
      elapsedMs: 0,
    }
    const recognizeResume = vi.fn().mockResolvedValue(runningJob)
    const fetchJob = vi.fn().mockResolvedValue(runningJob)

    render(
      <ResumeImportPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createFetchResumeImportJobMethod={(() => ({ send: () => fetchJob() })) as any}
        createRecognizeResumeImportMethod={
          (() => ({ send: () => recognizeResume() })) as any
        }
      />,
    )

    const file = new File(['# 厉飞雨'], 'lifeiyu-mock-zh.md', {
      type: 'text/markdown',
    })

    fireEvent.change(screen.getByLabelText('选择简历导入文件'), {
      target: { files: [file] },
    })
    fireEvent.click(screen.getByRole('button', { name: '上传并启动识别' }))

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('模型正在生成候选草稿。')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(9999)
    })
    expect(fetchJob).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(fetchJob).toHaveBeenCalledTimes(1)
    expect(screen.getByText('10.0 秒')).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000)
    })
    expect(fetchJob).toHaveBeenCalledTimes(4)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(4999)
    })
    expect(fetchJob).toHaveBeenCalledTimes(4)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(fetchJob).toHaveBeenCalledTimes(5)
  })

  it('renders failed job details and allows retrying', async () => {
    const user = userEvent.setup()
    const recognizeResume = vi.fn().mockResolvedValue({
      jobId: 'resume-import-job-002',
      status: 'running',
      currentStage: 'accepted',
      steps: [
        {
          stage: 'accepted',
          label: '已接收上传请求',
          status: 'running',
        },
      ],
      createdAt: '2026-04-28T12:00:00.000Z',
      updatedAt: '2026-04-28T12:00:00.000Z',
      elapsedMs: 0,
    })
    const fetchJob = vi.fn().mockResolvedValue({
      jobId: 'resume-import-job-002',
      status: 'failed',
      currentStage: 'failed',
      steps: [
        {
          stage: 'accepted',
          label: '已接收上传请求',
          status: 'failed',
          message: 'DeepSeek chat completions request failed with status 401',
          details: ['provider returned unauthorized'],
        },
      ],
      createdAt: '2026-04-28T12:00:00.000Z',
      updatedAt: '2026-04-28T12:00:02.000Z',
      elapsedMs: 2000,
      error: {
        message: 'DeepSeek chat completions request failed with status 401',
        traceId: 'trace-resume-import',
      },
    })

    render(
      <ResumeImportPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createFetchResumeImportJobMethod={(() => ({ send: () => fetchJob() })) as any}
        createRecognizeResumeImportMethod={
          (() => ({ send: () => recognizeResume() })) as any
        }
        elapsedTickMs={1}
        initialPollIntervalMs={1}
        slowPollAfterMs={40}
        slowPollIntervalMs={1}
      />,
    )

    const file = new File(['# 厉飞雨'], 'lifeiyu-mock-zh.md', {
      type: 'text/markdown',
    })

    await user.upload(screen.getByLabelText('选择简历导入文件'), file)
    await user.click(screen.getByRole('button', { name: '上传并启动识别' }))

    expect(
      await screen.findByText(
        '接口返回：DeepSeek chat completions request failed with status 401（traceId: trace-resume-import）',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('provider returned unauthorized')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试识别' })).toBeInTheDocument()
  })
})

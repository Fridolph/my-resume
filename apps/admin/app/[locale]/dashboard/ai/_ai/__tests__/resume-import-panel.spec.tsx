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
  window.localStorage.clear()
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
    const completedJob = {
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
    }
    const fetchJob = vi.fn().mockResolvedValue(completedJob)
    const streamJob = vi.fn(async (_input, handlers) => {
      handlers.onCompleted?.(completedJob)
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
        streamResumeImportJobMethod={streamJob as any}
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
      expect(streamJob).toHaveBeenCalledWith(
        expect.objectContaining({
          accessToken: 'admin-token',
          apiBaseUrl: 'http://localhost:5577',
          jobId: 'resume-import-job-001',
        }),
        expect.any(Object),
      )
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

  it('keeps the page usable when a job snapshot has no steps yet', async () => {
    const user = userEvent.setup()
    const recognizeResume = vi.fn().mockResolvedValue({
      jobId: 'resume-import-job-no-steps',
      status: 'running',
      currentStage: 'accepted',
      createdAt: '2026-04-28T12:00:00.000Z',
      updatedAt: '2026-04-28T12:00:00.000Z',
      elapsedMs: 0,
    })
    const streamJob = vi.fn(() => new Promise<void>(() => undefined))

    render(
      <ResumeImportPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createRecognizeResumeImportMethod={
          (() => ({ send: () => recognizeResume() })) as any
        }
        streamResumeImportJobMethod={streamJob as any}
      />,
    )

    const file = new File(['# 厉飞雨'], 'lifeiyu-mock-zh.md', {
      type: 'text/markdown',
    })

    await user.upload(screen.getByLabelText('选择简历导入文件'), file)
    await user.click(screen.getByRole('button', { name: '上传并启动识别' }))

    expect(await screen.findByTestId('resume-import-job-panel')).toBeInTheDocument()
    expect(screen.getByText('任务已创建，正在等待服务端返回阶段时间线。你可以保持页面打开，或稍后手动刷新状态。')).toBeInTheDocument()
    expect(screen.getByText('accepted')).toBeInTheDocument()
  })

  it('restores a running job from local storage after page refresh', async () => {
    window.localStorage.setItem(
      'my-resume:ai:resume-import:active-job-id',
      'resume-import-job-restored',
    )
    const restoredJob = {
      jobId: 'resume-import-job-restored',
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
    const fetchJob = vi.fn().mockResolvedValue(restoredJob)
    const streamJob = vi.fn(() => new Promise<void>(() => undefined))

    render(
      <ResumeImportPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createFetchResumeImportJobMethod={(() => ({ send: () => fetchJob() })) as any}
        streamResumeImportJobMethod={streamJob as any}
      />,
    )

    expect(
      (await screen.findAllByText('正在调用 AI 生成候选草稿')).length,
    ).toBeGreaterThanOrEqual(1)
    expect(fetchJob).toHaveBeenCalledTimes(1)
    expect(streamJob).toHaveBeenCalledWith(
      expect.objectContaining({
        jobId: 'resume-import-job-restored',
      }),
      expect.any(Object),
    )
  })

  it('keeps elapsed time readable when a running snapshot misses timestamps', async () => {
    const user = userEvent.setup()
    const recognizeResume = vi.fn().mockResolvedValue({
      jobId: 'resume-import-job-missing-time',
      status: 'running',
      currentStage: 'ai_generating',
      steps: [
        {
          stage: 'ai_generating',
          label: '正在调用 AI 生成候选草稿',
          status: 'running',
        },
      ],
    })
    const streamJob = vi.fn(() => new Promise<void>(() => undefined))

    render(
      <ResumeImportPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createRecognizeResumeImportMethod={
          (() => ({ send: () => recognizeResume() })) as any
        }
        streamResumeImportJobMethod={streamJob as any}
      />,
    )

    const file = new File(['# 厉飞雨'], 'lifeiyu-mock-zh.md', {
      type: 'text/markdown',
    })

    await user.upload(screen.getByLabelText('选择简历导入文件'), file)
    await user.click(screen.getByRole('button', { name: '上传并启动识别' }))

    expect(await screen.findByTestId('resume-import-job-panel')).toBeInTheDocument()
    expect(screen.getByText('0 秒')).toBeInTheDocument()
    expect(screen.queryByText(/NaN 秒/)).not.toBeInTheDocument()
  })

  it('updates elapsed time locally without automatic polling', async () => {
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
    const streamJob = vi.fn((_input, handlers) => {
      handlers.onHeartbeat?.({
        jobId: 'resume-import-job-003',
        timestamp: '2026-04-28T12:00:00.000Z',
      })
      handlers.onProgressHint?.({
        jobId: 'resume-import-job-003',
        message: '正在梳理教育经历',
        timestamp: '2026-04-28T12:00:08.000Z',
      })

      return new Promise<void>(() => undefined)
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
        streamResumeImportJobMethod={streamJob as any}
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
    expect(
      screen.getByText(/单次调用生成候选草稿和输入治理报告，通常需要 3-5 分钟/),
    ).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })

    expect(fetchJob).not.toHaveBeenCalled()
    expect(streamJob).toHaveBeenCalledTimes(1)
    expect(screen.getByText('10 秒')).toBeInTheDocument()
    expect(screen.getByText(/实时连接正常，最近心跳 10 秒前/)).toBeInTheDocument()
    expect(screen.getByText(/正在梳理教育经历/)).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(50_000)
    })
    expect(fetchJob).not.toHaveBeenCalled()
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
    const failedJob = {
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
    }
    const fetchJob = vi.fn().mockResolvedValue(failedJob)
    const streamJob = vi.fn(async (_input, handlers) => {
      handlers.onFailed?.(failedJob)
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
        streamResumeImportJobMethod={streamJob as any}
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

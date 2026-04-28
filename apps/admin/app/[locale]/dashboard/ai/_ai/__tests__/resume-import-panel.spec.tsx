'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
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

  it('uploads md/txt resume and redirects to result dashboard', async () => {
    const user = userEvent.setup()
    const onRecognized = vi.fn()
    const recognizeResume = vi.fn().mockResolvedValue({
      resultId: 'resume-import-001',
      locale: 'zh',
      fileName: 'lifeiyu-mock-zh.md',
      fileType: 'md',
      charCount: 12000,
      summary: '已识别候选草稿',
      warnings: [],
      changedModules: ['profile', 'projects'],
      moduleDiffs: [],
      moduleStats: {
        education: 1,
        experiences: 4,
        projects: 4,
        skills: 6,
        highlights: 5,
      },
      createdAt: '2026-04-28T12:00:00.000Z',
      providerSummary: {
        provider: 'mock',
        model: 'mock-resume-import',
        mode: 'mock',
      },
    })
    const createRecognizeResumeImportMethod = vi.fn((input) => ({
      send: () => recognizeResume(input),
    }))

    render(
      <ResumeImportPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createRecognizeResumeImportMethod={createRecognizeResumeImportMethod as any}
        onRecognized={onRecognized}
      />,
    )

    const file = new File(['# 厉飞雨'], 'lifeiyu-mock-zh.md', {
      type: 'text/markdown',
    })

    await user.upload(screen.getByLabelText('选择简历导入文件'), file)
    await user.click(screen.getByRole('button', { name: '上传并识别简历' }))

    await waitFor(() => {
      expect(recognizeResume).toHaveBeenCalledWith({
        accessToken: 'admin-token',
        apiBaseUrl: 'http://localhost:5577',
        file,
      })
    })
    expect(onRecognized).toHaveBeenCalledWith(
      expect.objectContaining({
        resultId: 'resume-import-001',
      }),
    )
    expect(routerPushMock).toHaveBeenCalledWith(
      '/dashboard/ai/resume-import/results/resume-import-001',
    )
  })
})

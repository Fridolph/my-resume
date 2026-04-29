'use client'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ResumeImportShell } from '../resume-import-shell'

const { deleteHistoryMock, fetchHistoryDetailMock, fetchHistoryMock, useAdminSessionMock } = vi.hoisted(() => ({
  deleteHistoryMock: vi.fn(),
  fetchHistoryDetailMock: vi.fn(),
  fetchHistoryMock: vi.fn(),
  useAdminSessionMock: vi.fn(),
}))

vi.mock('@core/admin-session', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('../components/resume-import-panel', () => ({
  ResumeImportPanel: () => <div data-testid="resume-import-panel" />,
}))

vi.mock('../components/resume-import-history-table', () => ({
  ResumeImportHistoryTable: ({ onDeleteRecord, onViewRecord, records }: any) => (
    <div data-testid="resume-import-history-table">
      <span>{records.length}</span>
      <button onClick={() => onViewRecord?.({ id: 'usage-resume-import-001', inputPreview: 'resume.md' })}>
        查看详情
      </button>
      <button onClick={() => onDeleteRecord?.({ id: 'usage-resume-import-001', inputPreview: 'resume.md' })}>
        删除
      </button>
    </div>
  ),
}))

vi.mock('../services/ai-workbench-api', () => ({
  createDeleteAiUsageRecordMethod: ({ recordId }: { recordId: string }) => ({
    config: {
      method: 'DELETE',
      url: `/api/ai/reports/history/${recordId}`,
    },
  }),
  createFetchAiUsageHistoryMethod: () => ({
    config: {
      method: 'GET',
      url: '/api/ai/reports/history',
    },
  }),
  createFetchAiUsageRecordDetailMethod: ({ recordId }: { recordId: string }) => ({
    config: {
      method: 'GET',
      url: `/api/ai/reports/history/${recordId}`,
    },
  }),
}))

vi.mock('alova/client', async () => {
  const React = await import('react')

  return {
    useRequest: (handler: any) => {
      const [data, setData] = React.useState<unknown[]>([])

      return {
        data,
        send: async (...args: unknown[]) => {
          const method = typeof handler === 'function' ? handler(...args) : null
          const pathname = method?.config?.url ?? method?.url ?? ''

          if (String(pathname).includes('/history/usage-resume-import-001') && String(pathname).includes('/api/ai/reports/history/usage-resume-import-001')) {
            if (method?.type === 'DELETE' || method?.config?.method === 'DELETE') {
              deleteHistoryMock()
              return { deleted: true, recordId: 'usage-resume-import-001' }
            }

            fetchHistoryDetailMock()
            return {
              id: 'usage-resume-import-001',
              inputPreview: 'resume.md',
              status: 'succeeded',
              summary: '详情摘要',
              detail: {
                resultId: 'result-import-001',
              },
            }
          }

          fetchHistoryMock()
          const nextData = [
            {
              id: 'usage-resume-import-001',
            },
          ]
          setData(nextData)
          return nextData
        },
      }
    },
  }
})

describe('ResumeImportShell', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('fetches resume import history only once after session becomes ready', async () => {
    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: {
        username: 'admin',
        role: 'admin',
        capabilities: {
          canTriggerAiAnalysis: true,
        },
      },
      status: 'ready',
    })

    render(<ResumeImportShell locale="zh" />)

    await waitFor(() => expect(fetchHistoryMock).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(screen.getByTestId('resume-import-history-table')).toHaveTextContent('1'))
    expect(screen.getByTestId('resume-import-history-section')).toBeInTheDocument()
    expect(screen.getByText('历史识别记录')).toBeInTheDocument()
    expect(fetchHistoryMock).toHaveBeenCalledTimes(1)
  })

  it('can view and delete a resume import history record', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    useAdminSessionMock.mockReturnValue({
      accessToken: 'admin-token',
      currentUser: {
        username: 'admin',
        role: 'admin',
        capabilities: {
          canTriggerAiAnalysis: true,
        },
      },
      status: 'ready',
    })

    render(<ResumeImportShell locale="zh" />)

    await waitFor(() => expect(fetchHistoryMock).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('button', { name: '查看详情' }))
    await waitFor(() => expect(fetchHistoryDetailMock).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('历史详情：resume.md')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '删除' }))
    await waitFor(() => expect(deleteHistoryMock).toHaveBeenCalledTimes(1))
  })
})

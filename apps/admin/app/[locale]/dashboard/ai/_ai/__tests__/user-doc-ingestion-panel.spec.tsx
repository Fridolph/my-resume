import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AiUserDocIngestionPanel } from '../components/user-doc-ingestion-panel'
import type { UserDocIngestResult } from '../types/ai-file.types'

vi.mock('alova/client', () => ({
  useRequest: (handler: (...args: unknown[]) => Promise<unknown>) => ({
    loading: false,
    send: (...args: unknown[]) => handler(...args),
  }),
}))

function createIngestResult(
  overrides: Partial<UserDocIngestResult> = {},
): UserDocIngestResult {
  return {
    documentId: 'user-doc:abc:und',
    sourceId: 'abc',
    sourceScope: 'published',
    sourceVersion: 'upload:1776839100000',
    chunkCount: 2,
    fileName: 'rag-notes.md',
    fileType: 'md',
    chunkingProfile: 'contextual',
    chunkSize: 1000,
    chunkOverlap: 100,
    uploadedAt: '2026-04-22T03:45:00.000Z',
    ...overrides,
  }
}

describe('AiUserDocIngestionPanel', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders readonly guidance for viewer role', () => {
    render(
      <AiUserDocIngestionPanel
        accessToken="viewer-token"
        apiBaseUrl="http://localhost:5577"
        canUpload={false}
      />,
    )

    expect(screen.getByText('当前角色只读')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /上传并写入/ })).not.toBeInTheDocument()
  })

  it('uploads file with custom chunking numbers, then shows traceable result summary', async () => {
    const user = userEvent.setup()
    const result = createIngestResult({
      chunkSize: 80,
      chunkOverlap: 10,
    })
    const createIngestUserDocMethod = vi.fn().mockResolvedValue(result)
    const onIngested = vi.fn()

    render(
      <AiUserDocIngestionPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createIngestUserDocMethod={createIngestUserDocMethod}
        onIngested={onIngested}
      />,
    )

    const file = new File(['# RAG notes'], 'rag-notes.md', {
      type: 'text/markdown',
    })

    await user.upload(screen.getByLabelText('选择入库文件'), file)
    await user.selectOptions(screen.getByLabelText('入库作用域'), 'published')
    await user.selectOptions(screen.getByLabelText('切片策略'), 'contextual')

    expect((screen.getByLabelText('切片大小') as HTMLInputElement).value).toBe('1000')
    expect((screen.getByLabelText('重叠字符数') as HTMLInputElement).value).toBe('100')

    await user.clear(screen.getByLabelText('切片大小'))
    await user.type(screen.getByLabelText('切片大小'), '80')
    await user.clear(screen.getByLabelText('重叠字符数'))
    await user.type(screen.getByLabelText('重叠字符数'), '10')
    await user.click(screen.getByRole('button', { name: '上传并写入 user_docs' }))

    await waitFor(() => {
      expect(createIngestUserDocMethod).toHaveBeenCalledWith(
        expect.objectContaining({
          apiBaseUrl: 'http://localhost:5577',
          accessToken: 'admin-token',
          file,
          scope: 'published',
          chunkingProfile: 'contextual',
          chunkSize: 80,
          chunkOverlap: 10,
        }),
      )
    })

    expect(onIngested).toHaveBeenCalledWith(result)
    expect(screen.getByText('upload:1776839100000')).toBeInTheDocument()
    expect(screen.getAllByText('contextual').length).toBeGreaterThan(0)
    expect(screen.getByText('80/10')).toBeInTheDocument()
  })

  it('blocks invalid chunking numbers before sending request', async () => {
    const user = userEvent.setup()
    const createIngestUserDocMethod = vi.fn()

    render(
      <AiUserDocIngestionPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createIngestUserDocMethod={createIngestUserDocMethod}
      />,
    )

    await user.upload(
      screen.getByLabelText('选择入库文件'),
      new File(['# RAG notes'], 'rag-notes.md', {
        type: 'text/markdown',
      }),
    )
    await user.clear(screen.getByLabelText('切片大小'))
    await user.type(screen.getByLabelText('切片大小'), '80')
    await user.clear(screen.getByLabelText('重叠字符数'))
    await user.type(screen.getByLabelText('重叠字符数'), '80')
    await user.click(screen.getByRole('button', { name: '上传并写入 user_docs' }))

    expect(await screen.findByText('重叠字符数必须小于切片大小')).toBeInTheDocument()
    expect(createIngestUserDocMethod).not.toHaveBeenCalled()
  })

  it('shows readable error when ingestion fails', async () => {
    const user = userEvent.setup()
    const createIngestUserDocMethod = vi
      .fn()
      .mockRejectedValue(new Error('Unsupported file type: csv'))

    render(
      <AiUserDocIngestionPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createIngestUserDocMethod={createIngestUserDocMethod}
      />,
    )

    await user.upload(
      screen.getByLabelText('选择入库文件'),
      new File(['# RAG notes'], 'rag-notes.md', {
        type: 'text/markdown',
      }),
    )
    await user.click(screen.getByRole('button', { name: '上传并写入 user_docs' }))

    expect(await screen.findByText('Unsupported file type: csv')).toBeInTheDocument()
  })
})

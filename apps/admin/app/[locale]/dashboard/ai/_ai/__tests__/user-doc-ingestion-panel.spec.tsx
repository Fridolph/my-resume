'use client'

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AiUserDocIngestionPanel } from '../components/user-doc-ingestion-panel'

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
})

describe('AiUserDocIngestionPanel', () => {
  it('should show read-only message when current role cannot ingest docs', () => {
    render(
      <AiUserDocIngestionPanel
        accessToken="viewer-token"
        apiBaseUrl="http://localhost:5577"
        canUpload={false}
      />,
    )

    expect(screen.getByText('当前角色只读')).toBeInTheDocument()
    expect(
      screen.getByText('viewer 当前只允许读取缓存与预设体验，不允许触发 user_docs 入库。'),
    ).toBeInTheDocument()
  })

  it('should upload user doc with selected scope and render ingest summary', async () => {
    const user = userEvent.setup()
    const onIngested = vi.fn()
    const ingestUserDoc = vi.fn().mockResolvedValue({
      documentId: 'user-doc:abc:und',
      sourceId: 'abc',
      sourceScope: 'published',
      sourceVersion: 'upload:1776839100000',
      chunkCount: 3,
      fileName: 'rag-notes.md',
      fileType: 'md',
      uploadedAt: '2026-04-22T03:45:00.000Z',
    })
    const createIngestUserDocMethod = vi.fn((input) => ({
      send: () => ingestUserDoc(input),
    }))

    render(
      <AiUserDocIngestionPanel
        accessToken="admin-token"
        apiBaseUrl="http://localhost:5577"
        canUpload
        createIngestUserDocMethod={createIngestUserDocMethod as any}
        onIngested={onIngested}
      />,
    )

    const file = new File(['# RAG Notes'], 'rag-notes.md', {
      type: 'text/markdown',
    })

    await user.upload(screen.getByLabelText('选择入库文件'), file)
    await user.selectOptions(screen.getByLabelText('入库作用域'), 'published')
    await user.click(screen.getByRole('button', { name: '上传并写入 user_docs' }))

    await waitFor(() => {
      expect(ingestUserDoc).toHaveBeenCalledWith({
        accessToken: 'admin-token',
        apiBaseUrl: 'http://localhost:5577',
        file,
        scope: 'published',
      })
    })

    expect(await screen.findByText('published')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(onIngested).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'rag-notes.md',
        sourceScope: 'published',
        chunkCount: 3,
      }),
    )
  })
})

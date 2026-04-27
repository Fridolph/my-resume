import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createExtractTextFromFileMethod,
  createIngestRagUserDocMethod,
} from '../services/ai-file-api'

function createJsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('ai file api client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should upload a file to the NestJS extraction endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          fileName: 'resume.md',
          fileType: 'md',
          mimeType: 'text/markdown',
          text: '# Resume',
          charCount: 8,
        }),
      ),
    )

    const file = new File(['# Resume'], 'resume.md', {
      type: 'text/markdown',
    })

    const result = await createExtractTextFromFileMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      file,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/extract-text',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo-token',
        },
        body: expect.any(FormData),
      }),
    )
    expect(result.fileType).toBe('md')
    expect(result.text).toContain('Resume')
  })

  it('should surface server extraction errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(400, {
          message: 'Unsupported file type: csv',
        }),
      ),
    )

    const file = new File(['a,b,c'], 'resume.csv', {
      type: 'text/csv',
    })

    await expect(
      createExtractTextFromFileMethod({
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'demo-token',
        file,
      }),
    ).rejects.toThrow('Unsupported file type: csv')
  })

  it('should upload user docs file to rag ingestion endpoint', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(201, {
          documentId: 'user-doc:abc:und',
          sourceId: 'abc',
          sourceScope: 'published',
          sourceVersion: 'upload:1776839100000',
          chunkCount: 2,
          fileName: 'rag-notes.md',
          fileType: 'md',
          uploadedAt: '2026-04-22T03:45:00.000Z',
        }),
      ),
    )

    const file = new File(['# RAG notes'], 'rag-notes.md', {
      type: 'text/markdown',
    })

    const result = await createIngestRagUserDocMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      file,
      scope: 'published',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/rag/ingest/user-doc',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer demo-token',
        },
        body: expect.any(FormData),
      }),
    )

    expect(result.sourceScope).toBe('published')
    expect(result.chunkCount).toBe(2)
  })
})

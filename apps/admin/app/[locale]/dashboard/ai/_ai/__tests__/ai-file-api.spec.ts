import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createExportRagUserDocsMethod,
  createExtractTextFromFileMethod,
  createFetchRagDocumentDetailMethod,
  createIngestRagUserDocMethod,
  createResetRagUserDocsMethod,
  createUpdateRagCustomDocumentMethod,
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
          chunkingProfile: 'contextual',
          chunkSize: 1000,
          chunkOverlap: 100,
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
      chunkingProfile: 'contextual',
      chunkSize: 80,
      chunkOverlap: 10,
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

    const requestInit = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined
    const formData = requestInit?.body as FormData | undefined
    expect(formData?.get('scope')).toBe('published')
    expect(formData?.get('chunkingProfile')).toBe('contextual')
    expect(formData?.get('chunkSize')).toBe('80')
    expect(formData?.get('chunkOverlap')).toBe('10')

    expect(result.sourceScope).toBe('published')
    expect(result.sourceVersion).toBe('upload:1776839100000')
    expect(result.chunkingProfile).toBe('contextual')
    expect(result.chunkCount).toBe(2)
  })

  it('should fetch rag document detail for admin editing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          id: 'user-doc:dao:und',
          title: 'Dao 核心原理',
          sourceType: 'user_docs',
          sourceScope: 'published',
          locale: 'und',
          contentType: 'tech_blog',
          content: '# Dao\n\n核心原理摘要',
          linkUrl: 'https://example.com/dao',
          summary: '从 Dao 的视角理解系统、约束与协作关系。',
          preview: '# Dao',
          chunkCount: 2,
          editable: true,
          createdAt: '2026-06-12T08:00:00.000Z',
          updatedAt: '2026-06-12T08:30:00.000Z',
        }),
      ),
    )

    const result = await createFetchRagDocumentDetailMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      documentId: 'user-doc:dao:und',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/rag/documents/user-doc:dao:und',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(result.editable).toBe(true)
    expect(result.content).toContain('核心原理')
    expect(result.summary).toContain('Dao')
  })

  it('should update custom rag document with json payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          updated: true,
          documentId: 'user-doc:dao:und',
          chunkCount: 3,
          vectorStoreBackend: 'milvus',
          vectorStoreSynced: true,
          vectorStoreWarning: null,
        }),
      ),
    )

    const result = await createUpdateRagCustomDocumentMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
      documentId: 'user-doc:dao:und',
      title: 'Dao 核心原理',
      content: '# Dao\n\n更新后的内容',
      contentType: 'tech_blog',
      scope: 'published',
      linkUrl: 'https://example.com/dao',
      summary: '更新后的 Dao 技术博客概览',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/rag/custom/user-doc:dao:und',
      expect.objectContaining({
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer demo-token',
        },
        body: JSON.stringify({
          title: 'Dao 核心原理',
          content: '# Dao\n\n更新后的内容',
          contentType: 'tech_blog',
          scope: 'published',
          linkUrl: 'https://example.com/dao',
          summary: '更新后的 Dao 技术博客概览',
        }),
      }),
    )
    expect(result.updated).toBe(true)
    expect(result.chunkCount).toBe(3)
  })

  it('should export user_docs snapshot through admin api client', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          exportedAt: '2026-06-15T08:00:00.000Z',
          documentCount: 2,
          documents: [],
        }),
      ),
    )

    const result = await createExportRagUserDocsMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/rag/user-docs/export',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(result.documentCount).toBe(2)
  })

  it('should reset user_docs snapshot through admin api client', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          resetAt: '2026-06-15T08:00:00.000Z',
          deletedDocumentIds: ['user-doc:dao:und'],
          deletedVectorDocumentIds: ['user-doc:dao:und'],
          backend: 'milvus',
        }),
      ),
    )

    const result = await createResetRagUserDocsMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'demo-token',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/rag/user-docs/reset',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
    expect(result.deletedDocumentIds).toEqual(['user-doc:dao:und'])
  })
})

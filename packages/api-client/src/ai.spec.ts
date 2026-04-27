import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFetchAiUsageHistoryMethod,
  createFetchAiUsageRecordDetailMethod,
  createFetchCachedAiWorkbenchReportsMethod,
  createIngestRagUserDocMethod,
} from './ai'

function createJsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('ai api client methods', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns cached report summaries directly from method.send()', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          reports: [
            {
              reportId: 'jd-match-demo',
              scenario: 'jd-match',
              locale: 'zh',
              summary: '缓存版 JD 匹配预览',
              generator: 'mock-cache',
              createdAt: '2026-03-27T00:00:00.000Z',
            },
          ],
        }),
      ),
    )

    const reports = await createFetchCachedAiWorkbenchReportsMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'viewer-token',
    }).send()

    expect(Array.isArray(reports)).toBe(true)
    expect(reports[0]?.reportId).toBe('jd-match-demo')
  })

  it('returns ai usage history summaries directly from method.send()', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          records: [
            {
              id: 'usage-report-001',
              operationType: 'analysis-report',
              scenario: 'jd-match',
              locale: 'zh',
              inputPreview: 'NestJS React',
              summary: '真实分析摘要',
              provider: 'qiniu',
              model: 'deepseek-v3',
              mode: 'openai-compatible',
              generator: 'ai-provider',
              status: 'succeeded',
              relatedReportId: 'report-001',
              relatedResultId: null,
              errorMessage: null,
              durationMs: 1800,
              createdAt: '2026-04-15T10:00:00.000Z',
            },
          ],
        }),
      ),
    )

    const records = await createFetchAiUsageHistoryMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      type: 'analysis-report',
      limit: 20,
    }).send()

    expect(records[0]?.id).toBe('usage-report-001')
  })

  it('returns ai usage history detail directly from method.send()', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          id: 'usage-report-001',
          operationType: 'analysis-report',
          scenario: 'jd-match',
          locale: 'zh',
          inputPreview: 'NestJS React',
          summary: '真实分析摘要',
          provider: 'qiniu',
          model: 'deepseek-v3',
          mode: 'openai-compatible',
          generator: 'ai-provider',
          status: 'succeeded',
          relatedReportId: 'report-001',
          relatedResultId: null,
          errorMessage: null,
          durationMs: 1800,
          createdAt: '2026-04-15T10:00:00.000Z',
          detail: {
            reportId: 'report-001',
          },
        }),
      ),
    )

    const detail = await createFetchAiUsageRecordDetailMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      recordId: 'usage-report-001',
    }).send()

    expect(detail.detail).toEqual({
      reportId: 'report-001',
    })
  })

  it('uploads user docs file to rag ingestion endpoint', async () => {
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
      accessToken: 'admin-token',
      file,
      scope: 'published',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/rag/ingest/user-doc',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer admin-token',
        },
        body: expect.any(FormData),
      }),
    )

    const requestInit = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined
    const formData = requestInit?.body as FormData | undefined
    expect(formData?.get('scope')).toBe('published')

    expect(result.sourceScope).toBe('published')
    expect(result.chunkCount).toBe(2)
  })
})

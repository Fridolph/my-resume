import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createFetchAiUsageHistoryMethod,
  createFetchAiUsageRecordDetailMethod,
  createFetchCachedAiWorkbenchReportsMethod,
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
})

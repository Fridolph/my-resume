import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createFetchCachedAiWorkbenchReportsMethod } from './ai'

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
})

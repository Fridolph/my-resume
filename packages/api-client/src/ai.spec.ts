import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createApplyAiResumeImportMethod,
  createFetchAiResumeImportJobMethod,
  createFetchAiResumeImportResultMethod,
  createFetchAiUsageHistoryMethod,
  createFetchAiUsageRecordDetailMethod,
  createFetchCachedAiWorkbenchReportsMethod,
  createIngestRagUserDocMethod,
  createRecognizeAiResumeImportMethod,
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

  it('starts a resume import recognition job for an uploaded resume file', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(202, {
          jobId: 'resume-import-job-001',
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
        }),
      ),
    )

    const file = new File(['# 厉飞雨'], 'lifeiyu-mock-zh.md', {
      type: 'text/markdown',
    })

    const result = await createRecognizeAiResumeImportMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      file,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/resume-import/recognize',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer admin-token',
        },
        body: expect.any(FormData),
      }),
    )
    expect(result.jobId).toBe('resume-import-job-001')
    expect(result.currentStage).toBe('accepted')
  })

  it('fetches resume import recognition job state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          jobId: 'resume-import-job-001',
          status: 'completed',
          currentStage: 'completed',
          steps: [],
          createdAt: '2026-04-28T12:00:00.000Z',
          updatedAt: '2026-04-28T12:00:05.000Z',
          elapsedMs: 5000,
          resultId: 'resume-import-001',
        }),
      ),
    )

    const result = await createFetchAiResumeImportJobMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      jobId: 'resume-import-job-001',
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/resume-import/jobs/resume-import-job-001',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      }),
    )
    expect(result.resultId).toBe('resume-import-001')
  })

  it('keeps resume import job step summaries and details from the API response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          jobId: 'resume-import-job-001',
          status: 'running',
          currentStage: 'schema_validating',
          steps: [
            {
              stage: 'schema_validating',
              label: '正在校验 StandardResume 结构',
              status: 'running',
              summary: '结构校验通过，自动修复 2 处 AI 输出形状。',
              details: ['已自动修复 education[0].schoolName'],
            },
          ],
          createdAt: '2026-04-28T12:00:00.000Z',
          updatedAt: '2026-04-28T12:00:05.000Z',
          elapsedMs: 5000,
        }),
      ),
    )

    const result = await createFetchAiResumeImportJobMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      jobId: 'resume-import-job-001',
    })

    expect(result.steps[0]?.summary).toContain('自动修复')
    expect(result.steps[0]?.details).toEqual(['已自动修复 education[0].schoolName'])
  })

  it('fetches and applies resume import results', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          createJsonResponse(200, {
            resultId: 'resume-import-001',
            locale: 'zh',
            fileName: 'lifeiyu-mock-zh.md',
            fileType: 'md',
            charCount: 12000,
            summary: '已识别候选草稿',
            warnings: ['联系方式不完整'],
            changedModules: ['profile'],
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
          }),
        )
        .mockResolvedValueOnce(
          createJsonResponse(200, {
            status: 'draft',
            resume: {},
            updatedAt: '2026-04-28T12:10:00.000Z',
          }),
        ),
    )

    const result = await createFetchAiResumeImportResultMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      resultId: 'resume-import-001',
    })
    const applied = await createApplyAiResumeImportMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      resultId: 'resume-import-001',
      modules: ['profile'],
    })

    expect(result.warnings).toEqual(['联系方式不完整'])
    expect(applied.status).toBe('draft')
    expect(fetch).toHaveBeenLastCalledWith(
      'http://localhost:5577/api/ai/resume-import/apply',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resultId: 'resume-import-001',
          modules: ['profile'],
        }),
      }),
    )
  })
})

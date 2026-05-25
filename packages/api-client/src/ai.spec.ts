import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createClaimAiChatUseKeyMethod,
  createClaimPublicAiChatSessionMethod,
  createCreateAiChatLeadMethod,
  createAskRagMethod,
  createApplyAiResumeImportMethod,
  createDeleteAiUsageRecordMethod,
  createFetchAiResumeImportJobMethod,
  createFetchAiResumeImportResultMethod,
  createFetchAiUsageHistoryMethod,
  createFetchAiUsageRecordDetailMethod,
  createFetchCachedAiWorkbenchReportsMethod,
  createIngestRagUserDocMethod,
  createRecognizeAiResumeImportMethod,
  streamAiChatMessage,
  streamAiResumeImportJob,
} from './ai'

function createJsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function createSseResponse(messages: string): Response {
  const encoder = new TextEncoder()

  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(messages))
        controller.close()
      },
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    },
  )
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

  it('supports filtering resume import usage history', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          records: [
            {
              id: 'usage-resume-import-001',
              operationType: 'resume-import',
              scenario: 'resume-import',
              locale: 'zh',
              inputPreview: 'lifeiyu-mock-zh.md · 5896 字符',
              summary: '已识别候选草稿',
              provider: 'deepseek',
              model: 'deepseek-v4-flash',
              mode: 'openai-compatible',
              generator: 'ai-provider',
              status: 'succeeded',
              relatedReportId: null,
              relatedResultId: 'result-import-001',
              errorMessage: null,
              durationMs: 240000,
              createdAt: '2026-04-29T03:18:26.394Z',
            },
          ],
        }),
      ),
    )

    const records = await createFetchAiUsageHistoryMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      type: 'resume-import',
      limit: 20,
    }).send()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/history?limit=20&type=resume-import',
      expect.any(Object),
    )
    expect(records[0]).toMatchObject({
      operationType: 'resume-import',
      scenario: 'resume-import',
      relatedResultId: 'result-import-001',
    })
  })

  it('submits ai chat lead and claims useKey session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce(
          createJsonResponse(201, {
            id: 'lead-001',
            locale: 'zh',
            displayName: '李飞宇',
            companyName: '某科技公司',
            contact: 'wechat',
            message: '想了解项目经历',
            status: 'submitted',
            createdAt: '2026-05-12T00:00:00.000Z',
            updatedAt: '2026-05-12T00:00:00.000Z',
          }),
        )
        .mockResolvedValueOnce(
          createJsonResponse(200, {
            sessionId: 'session-001',
            locale: 'zh',
            status: 'open',
            turnCount: 0,
            remainingTurns: 20,
            useKeyStatus: 'claimed',
            lead: {
              id: 'lead-001',
              locale: 'zh',
              displayName: '李飞宇',
              companyName: '某科技公司',
              contact: 'wechat',
              message: '想了解项目经历',
              status: 'issued',
              createdAt: '2026-05-12T00:00:00.000Z',
              updatedAt: '2026-05-12T00:00:00.000Z',
            },
            messages: [],
            interimSummary: null,
            finalSummary: null,
            createdAt: '2026-05-12T00:00:00.000Z',
            updatedAt: '2026-05-12T00:00:00.000Z',
            closedAt: null,
          }),
        ),
    )

    const lead = await createCreateAiChatLeadMethod({
      apiBaseUrl: 'http://localhost:5577',
      locale: 'zh',
      displayName: '李飞宇',
      companyName: '某科技公司',
      contact: 'wechat',
      message: '想了解项目经历',
    }).send()
    const session = await createClaimAiChatUseKeyMethod({
      apiBaseUrl: 'http://localhost:5577',
      useKey: 'FY-1A2B3C4D',
      locale: 'zh',
    }).send()

    expect(lead.id).toBe('lead-001')
    expect(session.sessionId).toBe('session-001')
  })

  it('claims public ai chat session after consent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          consentRecordedAt: '2026-05-12T00:00:00.000Z',
          policyVersion: 'm23-public-ip-v1',
          turnsPerDay: 20,
          useKey: 'FY-9ABC1234',
          session: {
            sessionId: 'session-public-001',
            locale: 'zh',
            status: 'open',
            turnCount: 0,
            remainingTurns: 20,
            useKeyStatus: 'claimed',
            lead: {
              id: 'lead-public-001',
              locale: 'zh',
              displayName: '公开站访客',
              companyName: '',
              contact: '',
              message: '访客已同意公开站 AI 对话提示，系统自动创建当日会话。',
              status: 'issued',
              createdAt: '2026-05-12T00:00:00.000Z',
              updatedAt: '2026-05-12T00:00:00.000Z',
            },
            messages: [],
            interimSummary: null,
            finalSummary: null,
            createdAt: '2026-05-12T00:00:00.000Z',
            updatedAt: '2026-05-12T00:00:00.000Z',
            closedAt: null,
          },
        }),
      ),
    )

    const result = await createClaimPublicAiChatSessionMethod({
      apiBaseUrl: 'http://localhost:5577',
      consentAccepted: true,
      locale: 'zh',
    }).send()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/chat/public/claim',
      expect.objectContaining({
        method: 'POST',
      }),
    )
    expect(result.useKey).toBe('FY-9ABC1234')
    expect(result.session.sessionId).toBe('session-public-001')
  })

  it('streams ai chat message events with the full SSE protocol order', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createSseResponse([
          'event: start',
          'data: {"assistantMessageId":"assistant-001","remainingTurns":19,"sessionId":"session-001","turnCount":1}',
          '',
          'event: token',
          'data: {"text":"你好"}',
          '',
          'event: citation',
          'data: {"ref":"#1","title":"EDR - 终端威胁侦测与响应平台","snippet":"终端威胁侦测平台","section":"project"}',
          '',
          'event: block',
          'data: {"type":"project_card","title":"EDR - 终端威胁侦测与响应平台","subtitle":"负责人","period":"2024-01 - 2024-12","summary":"负责公开简历与 AI 对话整合","technologies":["RAG"],"highlights":["接入 SSE 流式回答"]}',
          '',
          'event: summary',
          'data: {"generatedAt":"2026-05-12T00:00:01.000Z","keywords":["RAG","SSE"],"stage":"turn-10","summary":"阶段总结"}',
          '',
          'event: done',
          'data: {"session":{"sessionId":"session-001","locale":"zh","status":"open","turnCount":1,"remainingTurns":19,"useKeyStatus":"claimed","lead":{"id":"lead-001","locale":"zh","displayName":"李飞宇","companyName":"","contact":"","message":"想了解项目经历","status":"issued","createdAt":"2026-05-12T00:00:00.000Z","updatedAt":"2026-05-12T00:00:00.000Z"},"messages":[],"interimSummary":null,"finalSummary":null,"createdAt":"2026-05-12T00:00:00.000Z","updatedAt":"2026-05-12T00:00:00.000Z","closedAt":null}}',
          '',
        ].join('\n')),
      ),
    )

    const startSpy = vi.fn()
    const tokenSpy = vi.fn()
    const citationSpy = vi.fn()
    const blockSpy = vi.fn()
    const summarySpy = vi.fn()
    const doneSpy = vi.fn()

    await streamAiChatMessage(
      {
        apiBaseUrl: 'http://localhost:5577',
        sessionId: 'session-001',
        useKey: 'FY-1A2B3C4D',
        content: '你好',
        },
        {
          onStart: startSpy,
          onToken: tokenSpy,
          onCitation: citationSpy,
          onBlock: blockSpy,
          onSummary: summarySpy,
          onDone: doneSpy,
        },
      )

    expect(startSpy).toHaveBeenCalled()
    expect(tokenSpy).toHaveBeenCalledWith({ text: '你好' })
    expect(citationSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        ref: '#1',
        section: 'project',
      }),
    )
    expect(blockSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'project_card',
      }),
    )
    expect(summarySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: 'turn-10',
      }),
    )
    expect(doneSpy).toHaveBeenCalled()
  })

  it('surfaces AI chat stream error events without throwing transport errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createSseResponse([
          'event: start',
          'data: {"assistantMessageId":"assistant-001","remainingTurns":19,"sessionId":"session-001","turnCount":1}',
          '',
          'event: error',
          'data: {"message":"stream failed"}',
          '',
        ].join('\n')),
      ),
    )

    const errorSpy = vi.fn()

    await streamAiChatMessage(
      {
        apiBaseUrl: 'http://localhost:5577',
        sessionId: 'session-001',
        useKey: 'FY-1A2B3C4D',
        content: '你好',
      },
      {
        onError: errorSpy,
      },
    )

    expect(errorSpy).toHaveBeenCalledWith({ message: 'stream failed' })
  })

  it('passes AbortSignal through to the AI chat stream request', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError')

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))

    const controller = new AbortController()
    controller.abort()

    await expect(
      streamAiChatMessage(
        {
          apiBaseUrl: 'http://localhost:5577',
          sessionId: 'session-001',
          useKey: 'FY-1A2B3C4D',
          content: '你好',
          signal: controller.signal,
        },
        {},
      ),
    ).rejects.toThrow('The operation was aborted.')

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/chat/sessions/session-001/messages',
      expect.objectContaining({
        signal: controller.signal,
      }),
    )
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

  it('deletes ai usage history records with bearer token', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          deleted: true,
          recordId: 'usage-report-001',
        }),
      ),
    )

    const result = await createDeleteAiUsageRecordMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      recordId: 'usage-report-001',
    }).send()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/reports/history/usage-report-001',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
        }),
      }),
    )
    expect(result).toEqual({
      deleted: true,
      recordId: 'usage-report-001',
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
      accessToken: 'admin-token',
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
          Authorization: 'Bearer admin-token',
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
    expect(result.chunkSize).toBe(1000)
    expect(result.chunkCount).toBe(2)
  })

  it('asks rag endpoint and returns citations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        createJsonResponse(200, {
          answer: '候选人做过 RAG 检索问答 [#1]',
          citations: [
            {
              ref: '#1',
              id: 'project-rag',
              title: 'RAG 项目',
              section: 'projects',
              sourceType: 'resume_core',
              score: 0.92,
              snippet: '实现 RAG 检索问答能力',
            },
          ],
          matches: [
            {
              id: 'project-rag',
              title: 'RAG 项目',
              section: 'projects',
              content: '实现 RAG 检索问答能力',
              sourceType: 'resume_core',
              score: 0.92,
            },
          ],
          providerSummary: {
            provider: 'mock',
            model: 'mock-resume-advisor',
            mode: 'mock',
          },
        }),
      ),
    )

    const result = await createAskRagMethod({
      apiBaseUrl: 'http://localhost:5577',
      accessToken: 'admin-token',
      question: '候选人做过 RAG 吗？',
      limit: 4,
      locale: 'zh',
      useVectorStore: true,
      vectorScope: 'published',
      vectorFallbackToLocal: false,
    })

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/rag/ask',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer admin-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({
          question: '候选人做过 RAG 吗？',
          limit: 4,
          locale: 'zh',
          useVectorStore: true,
          vectorScope: 'published',
          vectorFallbackToLocal: false,
        }),
      }),
    )
    expect(result.citations[0]).toEqual(
      expect.objectContaining({
        ref: '#1',
        sourceType: 'resume_core',
        snippet: expect.stringContaining('RAG'),
      }),
    )
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

  it('streams resume import job events with bearer token headers', async () => {
    const onSnapshot = vi.fn()
    const onCompleted = vi.fn()
    const onProgressHint = vi.fn()

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          createSseResponse(
            [
              'event: job.snapshot',
              'data: {\"jobId\":\"resume-import-job-001\",\"status\":\"running\",\"currentStage\":\"ai_generating\",\"steps\":[],\"createdAt\":\"2026-04-28T12:00:00.000Z\",\"updatedAt\":\"2026-04-28T12:00:00.000Z\",\"elapsedMs\":1000}',
              '',
              'event: job.progress_hint',
              'data: {\"jobId\":\"resume-import-job-001\",\"message\":\"正在梳理教育经历\",\"timestamp\":\"2026-04-28T12:00:02.000Z\"}',
              '',
              'event: job.completed',
              'data: {\"jobId\":\"resume-import-job-001\",\"status\":\"completed\",\"currentStage\":\"completed\",\"steps\":[],\"createdAt\":\"2026-04-28T12:00:00.000Z\",\"updatedAt\":\"2026-04-28T12:00:05.000Z\",\"elapsedMs\":5000,\"resultId\":\"resume-import-001\"}',
              '',
              '',
            ].join('\n'),
          ),
        ),
    )

    await streamAiResumeImportJob(
      {
        apiBaseUrl: 'http://localhost:5577',
        accessToken: 'admin-token',
        jobId: 'resume-import-job-001',
      },
      {
        onSnapshot,
        onCompleted,
        onProgressHint,
      },
    )

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/api/ai/resume-import/jobs/resume-import-job-001/events',
      expect.objectContaining({
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: 'Bearer admin-token',
        },
      }),
    )
    expect(onSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        currentStage: 'ai_generating',
      }),
    )
    expect(onCompleted).toHaveBeenCalledWith(
      expect.objectContaining({
        resultId: 'resume-import-001',
      }),
    )
    expect(onProgressHint).toHaveBeenCalledWith({
      jobId: 'resume-import-job-001',
      message: '正在梳理教育经历',
      timestamp: '2026-04-28T12:00:02.000Z',
    })
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
            moduleContents: [
              {
                module: 'profile',
                title: '基本信息',
                currentItems: [],
                candidateItems: [
                  {
                    key: 'profile',
                    title: '厉飞雨',
                    meta: ['邮箱：lifeiyu@example.com'],
                    body: ['AI 工程化候选草稿'],
                  },
                ],
                warnings: ['联系方式不完整'],
              },
            ],
            moduleStats: {
              education: 1,
              experiences: 4,
              projects: 4,
              skills: 6,
              highlights: 5,
            },
            createdAt: '2026-04-28T12:00:00.000Z',
            canApply: true,
            appliedModules: [],
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
    expect(result.canApply).toBe(true)
    expect(result.appliedModules).toEqual([])
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

import { BadGatewayException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AiReportController } from '../ai-report.controller'

describe('AiReportController', () => {
  const generateTextMock = vi.fn()
  const getProviderSummaryMock = vi.fn()
  const recordSuccessMock = vi.fn()
  const recordFailureMock = vi.fn()
  const storeGeneratedReportMock = vi.fn()
  const generateSuggestionMock = vi.fn()
  const getSuggestionSnapshotForPersistenceMock = vi.fn()

  const aiService = {
    generateText: generateTextMock,
    getProviderSummary: getProviderSummaryMock,
  }
  const aiUsageRecordService = {
    recordSuccess: recordSuccessMock,
    recordFailure: recordFailureMock,
  }
  const aiResumeOptimizationService = {
    generateSuggestion: generateSuggestionMock,
    getSuggestionSnapshotForPersistence: getSuggestionSnapshotForPersistenceMock,
    getSuggestionResult: vi.fn(),
    applySuggestion: vi.fn(),
  }
  const analysisReportCacheService = {
    listReports: vi.fn(),
    getReportById: vi.fn(),
    getOrCreateReport: vi.fn(),
    storeGeneratedReport: storeGeneratedReportMock,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    getProviderSummaryMock.mockReturnValue({
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'openai-compatible',
    })
    getSuggestionSnapshotForPersistenceMock.mockReturnValue({
      resultId: 'result-001',
      locale: 'zh',
      summary: '优化摘要',
      focusAreas: ['强化摘要'],
      changedModules: ['profile'],
      moduleDiffs: [],
      createdAt: '2026-04-15T12:00:00.000Z',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
      patch: {
        profile: {
          summary: {
            zh: '建议摘要',
            en: 'Suggested summary',
          },
        },
      },
      draftUpdatedAt: '2026-04-15T11:58:00.000Z',
    })
  })

  it('should return usageRecordId after analyze succeeds', async () => {
    const controller = new AiReportController(
      aiService as never,
      aiUsageRecordService as never,
      aiResumeOptimizationService as never,
      analysisReportCacheService as never,
    )
    generateTextMock.mockResolvedValue({
      text: '{"summary":"demo"}',
    })
    storeGeneratedReportMock.mockReturnValue({
      reportId: 'report-001',
      summary: '分析摘要',
    })
    recordSuccessMock.mockResolvedValue({
      id: 'usage-001',
    })

    const result = await controller.analyzeReport({
      scenario: 'jd-match',
      content: 'NestJS React',
      locale: 'zh',
    })

    expect(result).toEqual({
      cached: false,
      report: {
        reportId: 'report-001',
        summary: '分析摘要',
      },
      usageRecordId: 'usage-001',
    })
    expect(recordSuccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'analysis-report',
        relatedReportId: 'report-001',
        summary: '分析摘要',
      }),
    )
  })

  it('should record failure before rethrowing analyze error', async () => {
    const controller = new AiReportController(
      aiService as never,
      aiUsageRecordService as never,
      aiResumeOptimizationService as never,
      analysisReportCacheService as never,
    )
    generateTextMock.mockRejectedValue(new BadGatewayException('provider failed'))

    await expect(
      controller.analyzeReport({
        scenario: 'jd-match',
        content: 'NestJS React',
        locale: 'zh',
      }),
    ).rejects.toThrow('provider failed')

    expect(recordFailureMock).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'analysis-report',
        errorMessage: 'provider failed',
      }),
    )
  })

  it('should return usageRecordId after resume optimization succeeds', async () => {
    const controller = new AiReportController(
      aiService as never,
      aiUsageRecordService as never,
      aiResumeOptimizationService as never,
      analysisReportCacheService as never,
    )
    generateSuggestionMock.mockResolvedValue({
      resultId: 'result-001',
      locale: 'zh',
      summary: '优化摘要',
      focusAreas: ['强化摘要'],
      changedModules: ['profile'],
      moduleDiffs: [],
      createdAt: '2026-04-15T12:00:00.000Z',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
    })
    recordSuccessMock.mockResolvedValue({
      id: 'usage-002',
    })

    const result = await controller.optimizeResume({
      instruction: '请优化当前简历',
      locale: 'zh',
    })

    expect(result).toMatchObject({
      resultId: 'result-001',
      usageRecordId: 'usage-002',
    })
    expect(recordSuccessMock).toHaveBeenCalledWith(
      expect.objectContaining({
        operationType: 'resume-optimization',
        relatedResultId: 'result-001',
        detail: expect.objectContaining({
          resultId: 'result-001',
          patch: expect.objectContaining({
            profile: expect.any(Object),
          }),
          draftUpdatedAt: '2026-04-15T11:58:00.000Z',
        }),
      }),
    )
  })
})

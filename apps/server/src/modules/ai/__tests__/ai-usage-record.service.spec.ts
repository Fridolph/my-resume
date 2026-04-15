import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AiUsageRecordService } from '../ai-usage-record.service'

describe('AiUsageRecordService', () => {
  const createMock = vi.fn()
  const findByIdMock = vi.fn()
  const listAllMock = vi.fn()
  const repository = {
    create: createMock,
    findById: findByIdMock,
    listAll: listAllMock,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should record successful ai usage with normalized preview', async () => {
    createMock.mockImplementation(async (input) => ({
      ...input,
      createdAt: input.createdAt,
    }))

    const service = new AiUsageRecordService(repository as never)
    const result = await service.recordSuccess({
      operationType: 'analysis-report',
      scenario: 'jd-match',
      locale: 'zh',
      inputPreview: '  React   NestJS   TypeScript  ',
      summary: '匹配良好',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
      generator: 'ai-provider',
      detail: {
        score: {
          label: '中等匹配',
          value: 78,
        },
      },
      durationMs: 1820,
      relatedReportId: 'report-001',
    })

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        inputPreview: 'React NestJS TypeScript',
        operationType: 'analysis-report',
        relatedReportId: 'report-001',
        status: 'succeeded',
      }),
    )
    expect(result.summary).toBe('匹配良好')
    expect(result.status).toBe('succeeded')
    expect(result.detail).toEqual({
      score: {
        label: '中等匹配',
        value: 78,
      },
    })
  })

  it('should record failed ai usage and keep error message', async () => {
    createMock.mockImplementation(async (input) => ({
      ...input,
      createdAt: input.createdAt,
    }))

    const service = new AiUsageRecordService(repository as never)
    const result = await service.recordFailure({
      operationType: 'resume-optimization',
      scenario: 'resume-review',
      locale: 'zh',
      inputPreview: '请优化当前简历',
      providerSummary: {
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
      },
      generator: 'ai-provider',
      errorMessage: 'Provider request failed',
      durationMs: 3000,
    })

    expect(result.status).toBe('failed')
    expect(result.errorMessage).toBe('Provider request failed')
    expect(result.summary).toBeNull()
  })

  it('should filter, sort and limit history records', async () => {
    listAllMock.mockResolvedValue([
      {
        id: 'record-001',
        operationType: 'analysis-report',
        scenario: 'jd-match',
        locale: 'zh',
        inputPreview: '旧输入',
        summary: '较早记录',
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
        generator: 'ai-provider',
        status: 'succeeded',
        relatedReportId: 'report-001',
        relatedResultId: null,
        detailJson: null,
        errorMessage: null,
        durationMs: 1000,
        createdAt: new Date('2026-04-15T08:00:00.000Z'),
      },
      {
        id: 'record-003',
        operationType: 'resume-optimization',
        scenario: 'resume-review',
        locale: 'zh',
        inputPreview: '优化输入',
        summary: '优化结果',
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
        generator: 'ai-provider',
        status: 'succeeded',
        relatedReportId: null,
        relatedResultId: 'result-003',
        detailJson: null,
        errorMessage: null,
        durationMs: 2300,
        createdAt: new Date('2026-04-15T10:00:00.000Z'),
      },
      {
        id: 'record-002',
        operationType: 'analysis-report',
        scenario: 'offer-compare',
        locale: 'zh',
        inputPreview: '新输入',
        summary: '较新记录',
        provider: 'qiniu',
        model: 'deepseek-v3',
        mode: 'openai-compatible',
        generator: 'ai-provider',
        status: 'succeeded',
        relatedReportId: 'report-002',
        relatedResultId: null,
        detailJson: {
          score: {
            label: '基础匹配良好',
            value: 81,
          },
        },
        errorMessage: null,
        durationMs: 1500,
        createdAt: new Date('2026-04-15T09:00:00.000Z'),
      },
    ])

    const service = new AiUsageRecordService(repository as never)
    const records = await service.listHistory({
      type: 'analysis-report',
      limit: 1,
    })

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      id: 'record-002',
      operationType: 'analysis-report',
      scoreLabel: '基础匹配良好',
      scoreValue: 81,
    })
  })

  it('should read a persisted detail record by id', async () => {
    findByIdMock.mockResolvedValue({
      id: 'record-009',
      operationType: 'analysis-report',
      scenario: 'jd-match',
      locale: 'zh',
      inputPreview: 'NestJS React',
      summary: '匹配概览',
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'openai-compatible',
      generator: 'ai-provider',
      status: 'succeeded',
      relatedReportId: 'report-009',
      relatedResultId: null,
      detailJson: {
        summary: '匹配概览',
      },
      errorMessage: null,
      durationMs: 1320,
      createdAt: new Date('2026-04-15T12:00:00.000Z'),
    })

    const service = new AiUsageRecordService(repository as never)
    const detail = await service.getDetail('record-009')

    expect(findByIdMock).toHaveBeenCalledWith('record-009')
    expect(detail.id).toBe('record-009')
    expect(detail.detail).toEqual({
      summary: '匹配概览',
    })
  })
})

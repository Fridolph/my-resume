import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AiUsageRecordService } from '../ai-usage-record.service'
import { createExampleStandardResume } from '../../resume/domain/standard-resume'

describe('AiUsageRecordService', () => {
  const createMock = vi.fn()
  const findByIdMock = vi.fn()
  const listAllMock = vi.fn()
  const findLatestSucceededResumeOptimizationByResultIdMock = vi.fn()
  const findLatestSucceededResumeImportByResultIdMock = vi.fn()
  const updateLatestSucceededResumeImportDetailByResultIdMock = vi.fn()
  const deleteByIdMock = vi.fn()
  const repository = {
    create: createMock,
    deleteById: deleteByIdMock,
    findById: findByIdMock,
    listAll: listAllMock,
    findLatestSucceededResumeOptimizationByResultId:
      findLatestSucceededResumeOptimizationByResultIdMock,
    findLatestSucceededResumeImportByResultId:
      findLatestSucceededResumeImportByResultIdMock,
    updateLatestSucceededResumeImportDetailByResultId:
      updateLatestSucceededResumeImportDetailByResultIdMock,
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
        id: 'record-004',
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
        detailJson: null,
        errorMessage: null,
        durationMs: 240000,
        createdAt: new Date('2026-04-15T11:00:00.000Z'),
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

  it('should filter resume import records from usage history', async () => {
    listAllMock.mockResolvedValue([
      {
        id: 'record-import-001',
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
        detailJson: null,
        errorMessage: null,
        durationMs: 240000,
        createdAt: new Date('2026-04-15T11:00:00.000Z'),
      },
      {
        id: 'record-analysis-001',
        operationType: 'analysis-report',
        scenario: 'jd-match',
        locale: 'zh',
        inputPreview: 'JD 分析',
        summary: '分析结果',
        provider: 'mock',
        model: 'mock',
        mode: 'mock',
        generator: 'mock-cache',
        status: 'succeeded',
        relatedReportId: 'report-001',
        relatedResultId: null,
        detailJson: null,
        errorMessage: null,
        durationMs: 1000,
        createdAt: new Date('2026-04-15T10:00:00.000Z'),
      },
    ])

    const service = new AiUsageRecordService(repository as never)
    const records = await service.listHistory({ type: 'resume-import' })

    expect(records).toHaveLength(1)
    expect(records[0]).toMatchObject({
      operationType: 'resume-import',
      scenario: 'resume-import',
      relatedResultId: 'result-import-001',
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

  it('should delete a persisted usage record by id', async () => {
    findByIdMock.mockResolvedValue({
      id: 'record-delete-001',
      operationType: 'resume-import',
      scenario: 'resume-import',
      locale: 'zh',
      inputPreview: 'resume.md',
      summary: '已识别候选草稿',
      provider: 'deepseek',
      model: 'deepseek-v4-flash',
      mode: 'openai-compatible',
      generator: 'ai-provider',
      status: 'succeeded',
      relatedReportId: null,
      relatedResultId: 'result-import-001',
      detailJson: null,
      errorMessage: null,
      durationMs: 1000,
      createdAt: new Date('2026-04-15T12:00:00.000Z'),
    })

    const service = new AiUsageRecordService(repository as never)
    const result = await service.deleteHistoryRecord('record-delete-001')

    expect(deleteByIdMock).toHaveBeenCalledWith('record-delete-001')
    expect(result).toEqual({
      deleted: true,
      recordId: 'record-delete-001',
    })
  })

  it('should resolve optimization snapshot by resultId with compatible fallback fields', async () => {
    findLatestSucceededResumeOptimizationByResultIdMock.mockResolvedValue({
      id: 'record-opt-001',
      operationType: 'resume-optimization',
      scenario: 'resume-review',
      locale: 'zh',
      inputPreview: '请优化当前简历',
      summary: '已生成优化建议',
      provider: 'qiniu',
      model: 'deepseek-v3',
      mode: 'openai-compatible',
      generator: 'ai-provider',
      status: 'succeeded',
      relatedReportId: null,
      relatedResultId: 'result-opt-001',
      detailJson: {
        resultId: 'result-opt-001',
        locale: 'zh',
        summary: '已生成优化建议',
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
        draftUpdatedAt: '2026-04-15T11:59:00.000Z',
      },
      errorMessage: null,
      durationMs: 1800,
      createdAt: new Date('2026-04-15T12:00:00.000Z'),
    })

    const service = new AiUsageRecordService(repository as never)
    const snapshot = await service.findResumeOptimizationSnapshotByResultId('result-opt-001')

    expect(findLatestSucceededResumeOptimizationByResultIdMock).toHaveBeenCalledWith(
      'result-opt-001',
    )
    expect(snapshot).toEqual(
      expect.objectContaining({
        resultId: 'result-opt-001',
        summary: '已生成优化建议',
        changedModules: ['profile'],
        draftUpdatedAt: '2026-04-15T11:59:00.000Z',
      }),
    )
  })

  it('should resolve resume import snapshot by resultId', async () => {
    const resume = createExampleStandardResume()
    findLatestSucceededResumeImportByResultIdMock.mockResolvedValue({
      id: 'record-import-001',
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
      detailJson: {
        candidateResume: resume,
        draftUpdatedAt: '2026-04-15T10:59:00.000Z',
        createdAt: '2026-04-15T11:00:00.000Z',
        resultDetail: {
          resultId: 'result-import-001',
          locale: 'zh',
          fileName: 'lifeiyu-mock-zh.md',
          fileType: 'md',
          charCount: 5896,
          summary: '已识别候选草稿',
          warnings: [],
          changedModules: ['profile'],
          moduleDiffs: [],
          moduleContents: [],
          moduleStats: {
            education: 1,
            experiences: 4,
            projects: 4,
            skills: 6,
            highlights: 5,
          },
          createdAt: '2026-04-15T11:00:00.000Z',
          canApply: true,
          appliedModules: [],
          providerSummary: {
            provider: 'deepseek',
            model: 'deepseek-v4-flash',
            mode: 'openai-compatible',
          },
        },
      },
      errorMessage: null,
      durationMs: 240000,
      createdAt: new Date('2026-04-15T11:00:00.000Z'),
    })

    const service = new AiUsageRecordService(repository as never)
    const snapshot = await service.findResumeImportSnapshotByResultId('result-import-001')

    expect(findLatestSucceededResumeImportByResultIdMock).toHaveBeenCalledWith(
      'result-import-001',
    )
    expect(snapshot?.detail).toMatchObject({
      resultId: 'result-import-001',
      fileName: 'lifeiyu-mock-zh.md',
      canApply: true,
    })
    expect(snapshot?.candidateResume.profile.fullName.zh).toBeTruthy()
  })
})

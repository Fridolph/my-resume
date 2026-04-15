import { Inject, Injectable, NotFoundException } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

import { type AnalysisLocale, type AnalysisScenario } from './analysis-report-cache.service'
import { AiUsageRecordRepository } from './ai-usage-record.repository'

export type AiUsageRecordOperationType = 'analysis-report' | 'resume-optimization'
export type AiUsageRecordStatus = 'succeeded' | 'failed'
export type AiUsageRecordGenerator = 'mock-cache' | 'ai-provider'
export type AiUsageRecordFilterType = 'all' | AiUsageRecordOperationType

interface ProviderSummary {
  provider: string
  model: string
  mode: string
}

interface RecordUsageBaseInput {
  detail?: unknown | null
  durationMs: number
  generator: AiUsageRecordGenerator
  inputPreview: string
  locale: AnalysisLocale
  operationType: AiUsageRecordOperationType
  providerSummary: ProviderSummary
  scenario: AnalysisScenario
}

export interface RecordAiUsageSuccessInput extends RecordUsageBaseInput {
  relatedReportId?: string
  relatedResultId?: string
  summary: string
}

export interface RecordAiUsageFailureInput extends RecordUsageBaseInput {
  errorMessage: string
  relatedReportId?: string
  relatedResultId?: string
}

export interface AiUsageRecordSummary {
  id: string
  operationType: AiUsageRecordOperationType
  scenario: AnalysisScenario
  locale: AnalysisLocale
  inputPreview: string
  summary: string | null
  provider: string
  model: string
  mode: string
  generator: AiUsageRecordGenerator
  status: AiUsageRecordStatus
  relatedReportId: string | null
  relatedResultId: string | null
  errorMessage: string | null
  durationMs: number
  createdAt: string
  scoreLabel?: string
  scoreValue?: number
}

export interface AiUsageRecordDetail extends AiUsageRecordSummary {
  detail: unknown | null
}

type AiUsageRecordRow = NonNullable<Awaited<ReturnType<AiUsageRecordRepository['findById']>>>

@Injectable()
export class AiUsageRecordService {
  constructor(
    @Inject(AiUsageRecordRepository)
    private readonly repository: AiUsageRecordRepository,
  ) {}

  async recordSuccess(input: RecordAiUsageSuccessInput): Promise<AiUsageRecordDetail> {
    const record = await this.repository.create({
      id: randomUUID(),
      operationType: input.operationType,
      scenario: input.scenario,
      locale: input.locale,
      inputPreview: normalizeInputPreview(input.inputPreview),
      summary: normalizeNullableText(input.summary),
      provider: input.providerSummary.provider,
      model: input.providerSummary.model,
      mode: input.providerSummary.mode,
      generator: input.generator,
      status: 'succeeded',
      relatedReportId: input.relatedReportId ?? null,
      relatedResultId: input.relatedResultId ?? null,
      detailJson: input.detail ?? null,
      errorMessage: null,
      durationMs: normalizeDuration(input.durationMs),
      createdAt: new Date(),
    })

    if (!record) {
      throw new NotFoundException('AI usage record not found')
    }

    return this.mapDetail(record)
  }

  async recordFailure(input: RecordAiUsageFailureInput): Promise<AiUsageRecordDetail> {
    const record = await this.repository.create({
      id: randomUUID(),
      operationType: input.operationType,
      scenario: input.scenario,
      locale: input.locale,
      inputPreview: normalizeInputPreview(input.inputPreview),
      summary: null,
      provider: input.providerSummary.provider,
      model: input.providerSummary.model,
      mode: input.providerSummary.mode,
      generator: input.generator,
      status: 'failed',
      relatedReportId: input.relatedReportId ?? null,
      relatedResultId: input.relatedResultId ?? null,
      detailJson: input.detail ?? null,
      errorMessage: normalizeNullableText(input.errorMessage),
      durationMs: normalizeDuration(input.durationMs),
      createdAt: new Date(),
    })

    if (!record) {
      throw new NotFoundException('AI usage record not found')
    }

    return this.mapDetail(record)
  }

  async listHistory(input?: {
    limit?: number
    type?: AiUsageRecordFilterType
  }): Promise<AiUsageRecordSummary[]> {
    const type = input?.type ?? 'all'
    const limit = normalizeLimit(input?.limit)
    const records = await this.repository.listAll()

    return records
      .filter((record) => type === 'all' || record.operationType === type)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit)
      .map((record) => this.mapSummary(record))
  }

  async getDetail(recordId: string): Promise<AiUsageRecordDetail> {
    const record = await this.repository.findById(recordId)

    if (!record) {
      throw new NotFoundException('AI usage record not found')
    }

    return this.mapDetail(record)
  }

  private mapSummary(record: AiUsageRecordRow) {
    const scoreMeta = extractScoreMeta(record.detailJson)

    return {
      id: record.id,
      operationType: record.operationType as AiUsageRecordOperationType,
      scenario: record.scenario as AnalysisScenario,
      locale: record.locale as AnalysisLocale,
      inputPreview: record.inputPreview,
      summary: record.summary ?? null,
      provider: record.provider,
      model: record.model,
      mode: record.mode,
      generator: record.generator as AiUsageRecordGenerator,
      status: record.status as AiUsageRecordStatus,
      relatedReportId: record.relatedReportId ?? null,
      relatedResultId: record.relatedResultId ?? null,
      errorMessage: record.errorMessage ?? null,
      durationMs: record.durationMs,
      createdAt: record.createdAt.toISOString(),
      scoreLabel: scoreMeta.label,
      scoreValue: scoreMeta.value,
    }
  }

  private mapDetail(record: AiUsageRecordRow) {
    return {
      ...this.mapSummary(record),
      detail: record.detailJson ?? null,
    }
  }
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function normalizeInputPreview(value: string): string {
  const normalized = value.replace(/\s+/g, ' ').trim()

  if (!normalized) {
    return '(empty)'
  }

  return normalized.slice(0, 240)
}

function normalizeDuration(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }

  return Math.round(value)
}

function normalizeLimit(value: number | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 20
  }

  return Math.min(Math.max(Math.floor(value), 1), 50)
}

function extractScoreMeta(detail: unknown): {
  label?: string
  value?: number
} {
  if (!detail || typeof detail !== 'object') {
    return {}
  }

  const candidate = detail as {
    score?: {
      label?: unknown
      value?: unknown
    }
  }

  return {
    label: typeof candidate.score?.label === 'string' ? candidate.score.label : undefined,
    value: typeof candidate.score?.value === 'number' ? candidate.score.value : undefined,
  }
}

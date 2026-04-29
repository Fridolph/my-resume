import { Inject, Injectable } from '@nestjs/common'
import { and, desc, eq } from 'drizzle-orm'

import { DATABASE_INSTANCE } from '../../../../database/database.tokens'
import type { DatabaseInstance } from '../../../../database/database.client'
import { aiUsageRecords } from '../../../../database/schema'

export interface CreateAiUsageRecordInput {
  id: string
  operationType: string
  scenario: string
  locale: string
  inputPreview: string
  summary?: string | null
  provider: string
  model: string
  mode: string
  generator: string
  status: string
  relatedReportId?: string | null
  relatedResultId?: string | null
  detailJson?: unknown | null
  errorMessage?: string | null
  durationMs: number
  createdAt: Date
}

@Injectable()
export class AiUsageRecordRepository {
  constructor(
    @Inject(DATABASE_INSTANCE)
    private readonly database: DatabaseInstance,
  ) {}

  async create(input: CreateAiUsageRecordInput) {
    await this.database.insert(aiUsageRecords).values({
      ...input,
      summary: input.summary ?? null,
      relatedReportId: input.relatedReportId ?? null,
      relatedResultId: input.relatedResultId ?? null,
      detailJson: input.detailJson ?? null,
      errorMessage: input.errorMessage ?? null,
    })

    return this.findById(input.id)
  }

  async findById(id: string) {
    const [record] = await this.database
      .select()
      .from(aiUsageRecords)
      .where(eq(aiUsageRecords.id, id))
      .limit(1)

    return record ?? null
  }

  async deleteById(id: string) {
    await this.database.delete(aiUsageRecords).where(eq(aiUsageRecords.id, id))
  }

  async listAll() {
    return this.database.select().from(aiUsageRecords).orderBy(desc(aiUsageRecords.createdAt))
  }

  async findLatestSucceededResumeOptimizationByResultId(resultId: string) {
    const [record] = await this.database
      .select()
      .from(aiUsageRecords)
      .where(
        and(
          eq(aiUsageRecords.relatedResultId, resultId),
          eq(aiUsageRecords.operationType, 'resume-optimization'),
          eq(aiUsageRecords.status, 'succeeded'),
        ),
      )
      .orderBy(desc(aiUsageRecords.createdAt))
      .limit(1)

    return record ?? null
  }

  async findLatestSucceededResumeImportByResultId(resultId: string) {
    const [record] = await this.database
      .select()
      .from(aiUsageRecords)
      .where(
        and(
          eq(aiUsageRecords.relatedResultId, resultId),
          eq(aiUsageRecords.operationType, 'resume-import'),
          eq(aiUsageRecords.status, 'succeeded'),
        ),
      )
      .orderBy(desc(aiUsageRecords.createdAt))
      .limit(1)

    return record ?? null
  }

  async updateDetailById(id: string, detailJson: unknown) {
    await this.database
      .update(aiUsageRecords)
      .set({ detailJson })
      .where(eq(aiUsageRecords.id, id))

    return this.findById(id)
  }

  async updateLatestSucceededResumeImportDetailByResultId(
    resultId: string,
    detailJson: unknown,
  ) {
    const record = await this.findLatestSucceededResumeImportByResultId(resultId)

    if (!record) {
      return null
    }

    return this.updateDetailById(record.id, detailJson)
  }
}

import { getTableColumns } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import { aiUsageRecords, resumeDrafts, resumePublicationSnapshots, systemMeta } from '../schema'

describe('database schema', () => {
  it('should keep the system meta table for infrastructure bootstrap', () => {
    expect(Object.keys(getTableColumns(systemMeta))).toEqual([
      'key',
      'value',
      'updatedAt',
    ])
  })

  it('should define a single draft table for the standard resume', () => {
    expect(Object.keys(getTableColumns(resumeDrafts))).toEqual([
      'resumeKey',
      'schemaVersion',
      'resumeJson',
      'updatedAt',
    ])
  })

  it('should define publication snapshots as append-only records', () => {
    expect(Object.keys(getTableColumns(resumePublicationSnapshots))).toEqual([
      'id',
      'resumeKey',
      'schemaVersion',
      'resumeJson',
      'publishedAt',
    ])
  })

  it('should define ai usage records for provider call auditing', () => {
    expect(Object.keys(getTableColumns(aiUsageRecords))).toEqual([
      'id',
      'operationType',
      'scenario',
      'locale',
      'inputPreview',
      'summary',
      'provider',
      'model',
      'mode',
      'generator',
      'status',
      'relatedReportId',
      'relatedResultId',
      'detailJson',
      'errorMessage',
      'durationMs',
      'createdAt',
    ])
  })
})

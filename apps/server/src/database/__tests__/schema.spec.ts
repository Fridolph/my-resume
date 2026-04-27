import { getTableColumns } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'

import {
  aiUsageRecords,
  ragChunks,
  ragDocuments,
  ragIndexRuns,
  resumeDrafts,
  resumePublicationSnapshots,
  systemMeta,
  users,
} from '../schema'

describe('database schema', () => {
  it('should define users table for persisted auth identities', () => {
    expect(Object.keys(getTableColumns(users))).toEqual([
      'id',
      'username',
      'passwordHash',
      'role',
      'isActive',
      'lastLoginAt',
      'createdAt',
      'updatedAt',
    ])
  })

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

  it('should define rag documents table for retrieval-side source contracts', () => {
    expect(Object.keys(getTableColumns(ragDocuments))).toEqual([
      'id',
      'sourceType',
      'sourceScope',
      'sourceId',
      'sourceVersion',
      'locale',
      'title',
      'contentHash',
      'metadataJson',
      'createdAt',
      'updatedAt',
    ])
  })

  it('should define rag chunks table for semantic retrieval blocks', () => {
    expect(Object.keys(getTableColumns(ragChunks))).toEqual([
      'id',
      'documentId',
      'chunkIndex',
      'section',
      'content',
      'contentHash',
      'embeddingJson',
      'metadataJson',
      'createdAt',
      'updatedAt',
    ])
  })

  it('should define rag index runs table for index lifecycle tracking', () => {
    expect(Object.keys(getTableColumns(ragIndexRuns))).toEqual([
      'id',
      'sourceType',
      'sourceScope',
      'sourceVersion',
      'status',
      'chunkCount',
      'errorMessage',
      'startedAt',
      'finishedAt',
      'createdAt',
      'updatedAt',
    ])
  })
})

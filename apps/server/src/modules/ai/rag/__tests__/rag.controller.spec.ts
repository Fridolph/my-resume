import { BadRequestException } from '@nestjs/common'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RagController } from '../rag.controller'

describe('RagController', () => {
  const ragService = {
    getStatus: vi.fn(),
    rebuildIndex: vi.fn(),
    search: vi.fn(),
    ask: vi.fn(),
  }
  const resumeRagSyncService = {
    syncCurrent: vi.fn(),
  }
  const userDocsIngestionService = {
    ingest: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should ingest uploaded file into user_docs retrieval scope', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    const file = {
      buffer: Buffer.from('doc'),
      originalname: 'rag-notes.md',
      mimetype: 'text/markdown',
      size: 3,
    } as Express.Multer.File

    vi.mocked(userDocsIngestionService.ingest).mockResolvedValue({
      documentId: 'user-doc:abc:und',
      sourceId: 'abc',
      sourceScope: 'published',
      sourceVersion: 'upload:1776839100000',
      chunkCount: 2,
      fileName: 'rag-notes.md',
      fileType: 'md',
      uploadedAt: '2026-04-22T03:45:00.000Z',
    })

    const result = await controller.ingestUserDoc(file, {
      scope: 'published',
    })

    expect(vi.mocked(userDocsIngestionService.ingest)).toHaveBeenCalledWith({
      buffer: file.buffer,
      originalname: 'rag-notes.md',
      mimetype: 'text/markdown',
      size: 3,
      sourceScope: 'published',
    })
    expect(result).toMatchObject({
      sourceScope: 'published',
      fileName: 'rag-notes.md',
      chunkCount: 2,
    })
  })

  it('should reject when uploaded file is missing', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )

    expect(() =>
      controller.ingestUserDoc(undefined, {
        scope: 'draft',
      }),
    ).toThrow(BadRequestException)
  })

  it('should reject unsupported user_docs ingest scope', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    const file = {
      buffer: Buffer.from('doc'),
      originalname: 'rag-notes.md',
      mimetype: 'text/markdown',
      size: 3,
    } as Express.Multer.File

    expect(() =>
      controller.ingestUserDoc(file, {
        scope: 'all' as never,
      }),
    ).toThrow('Unsupported ingest scope: all')
  })

  it('should pass search quality and routing options to rag service', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(ragService.search).mockResolvedValue([])

    await controller.search({
      query: 'Milvus 实验',
      limit: 3,
      minScore: 0.5,
      minScoreGap: 0.12,
      useVectorStore: true,
      vectorScope: 'draft',
      vectorFallbackToLocal: false,
    })

    expect(vi.mocked(ragService.search)).toHaveBeenCalledWith(
      'Milvus 实验',
      3,
      {
        minScore: 0.5,
        minScoreGap: 0.12,
      },
      {
        useVectorStore: true,
        vectorScope: 'draft',
        fallbackToLocal: false,
      },
    )
  })

  it('should reject unsupported search vectorScope', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )

    expect(() =>
      controller.search({
        query: 'Milvus 实验',
        vectorScope: 'team' as never,
      }),
    ).toThrow('Unsupported search vectorScope: team')
  })
})

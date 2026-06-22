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
    ingestCustom: vi.fn(),
    listDocuments: vi.fn(),
    getDocumentDetail: vi.fn(),
    updateCustom: vi.fn(),
    reconcileUserDocsVectors: vi.fn(),
    exportUserDocs: vi.fn(),
    resetUserDocs: vi.fn(),
    deleteDocument: vi.fn(),
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
      chunkingProfile: 'balanced',
      chunkSize: 500,
      chunkOverlap: 50,
      uploadedAt: '2026-04-22T03:45:00.000Z',
    })

    const result = await controller.ingestUserDoc(file, {
      scope: 'published',
      chunkingProfile: 'contextual',
      chunkSize: 800,
      chunkOverlap: 120,
    })

    expect(vi.mocked(userDocsIngestionService.ingest)).toHaveBeenCalledWith({
      buffer: file.buffer,
      originalname: 'rag-notes.md',
      mimetype: 'text/markdown',
      size: 3,
      sourceScope: 'published',
      title: 'rag-notes.md',
      chunkingProfile: 'contextual',
      chunkSize: 800,
      chunkOverlap: 120,
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

  it('should reject unsupported user_docs chunking profile', async () => {
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
        chunkingProfile: 'aggressive' as never,
      }),
    ).toThrow('Unsupported ingest chunkingProfile: aggressive')
  })

  it('should reject invalid user_docs chunking numbers', async () => {
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
        chunkingProfile: 'balanced',
        chunkSize: 3,
      }),
    ).toThrow('chunkSize must be between 4 and 6666')

    expect(() =>
      controller.ingestUserDoc(file, {
        chunkingProfile: 'balanced',
        chunkSize: 6667,
      }),
    ).toThrow('chunkSize must be between 4 and 6666')

    expect(() =>
      controller.ingestUserDoc(file, {
        chunkingProfile: 'balanced',
        chunkSize: 80,
        chunkOverlap: 80,
      }),
    ).toThrow('chunkOverlap must be less than chunkSize')

    expect(() =>
      controller.ingestUserDoc(file, {
        chunkingProfile: 'balanced',
        chunkOverlap: 301,
      }),
    ).toThrow('chunkOverlap must be between 0 and 300')

    expect(() =>
      controller.ingestUserDoc(file, {
        chunkingProfile: 'balanced',
        chunkSize: '80.5' as never,
      }),
    ).toThrow('chunkSize must be an integer')
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

  it('should pass ask routing options to rag service', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(ragService.ask).mockResolvedValue({
      answer: 'ok',
      citations: [],
      matches: [],
      providerSummary: {},
    })

    await controller.ask({
      question: '总结我的 user_docs',
      limit: 4,
      locale: 'zh',
      useVectorStore: true,
      vectorScope: 'published',
      vectorFallbackToLocal: false,
    })

    expect(vi.mocked(ragService.ask)).toHaveBeenCalledWith(
      '总结我的 user_docs',
      4,
      'zh',
      {
        useVectorStore: true,
        vectorScope: 'published',
        fallbackToLocal: false,
      },
    )
  })

  it('should reject unsupported ask vectorScope', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )

    expect(() =>
      controller.ask({
        question: 'query',
        vectorScope: 'team' as never,
      }),
    ).toThrow('Unsupported ask vectorScope: team')
  })

  it('should trigger user_docs vector reconcile', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(userDocsIngestionService.reconcileUserDocsVectors).mockResolvedValue({
      backend: 'milvus',
      dbDocumentCount: 5,
      vectorDocumentCountBefore: 6,
      deletedOrphans: ['user-doc:orphan'],
      reindexedDocuments: ['user-doc:dao'],
      warnings: [],
    })

    const result = await controller.reconcileUserDocsVectors()

    expect(vi.mocked(userDocsIngestionService.reconcileUserDocsVectors)).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      backend: 'milvus',
      dbDocumentCount: 5,
      deletedOrphans: ['user-doc:orphan'],
    })
  })

  it('should read rag document detail for admin manage view', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(userDocsIngestionService.getDocumentDetail).mockResolvedValue({
      id: 'user-doc:dao:und',
      title: 'Dao 核心原理',
      sourceType: 'user_docs',
      sourceScope: 'published',
      locale: 'und',
      contentType: 'tech_blog',
      content: '# Dao\n\n核心原理摘要',
      linkUrl: 'https://example.com/dao',
      linkUrls: ['https://example.com/dao'],
      imageUrls: ['https://example.com/dao.png'],
      editable: true,
      createdAt: '2026-06-12T08:00:00.000Z',
      updatedAt: '2026-06-12T08:30:00.000Z',
    })

    const result = await controller.getDocumentDetail('user-doc:dao:und')

    expect(vi.mocked(userDocsIngestionService.getDocumentDetail)).toHaveBeenCalledWith(
      'user-doc:dao:und',
    )
    expect(result).toMatchObject({
      id: 'user-doc:dao:und',
      editable: true,
    })
  })

  it('should update custom rag document from json body', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(userDocsIngestionService.updateCustom).mockResolvedValue({
      updated: true,
      documentId: 'user-doc:dao:und',
      chunkCount: 2,
      vectorStoreBackend: 'milvus',
      vectorStoreSynced: true,
      vectorStoreWarning: null,
    })

    const result = await controller.updateCustom('user-doc:dao:und', {
      title: 'Dao 核心原理',
      content: '# Dao\n\n更新后的内容',
      contentType: 'tech_blog',
      scope: 'published',
      linkUrls: ['https://example.com/dao', 'https://example.com/dao-2'],
      imageUrls: ['https://example.com/dao.png'],
      summary: '更新后的 Dao 文章概览',
    })

    expect(vi.mocked(userDocsIngestionService.updateCustom)).toHaveBeenCalledWith(
      'user-doc:dao:und',
      {
        title: 'Dao 核心原理',
        content: '# Dao\n\n更新后的内容',
        contentType: 'tech_blog',
        sourceScope: 'published',
        linkUrls: ['https://example.com/dao', 'https://example.com/dao-2'],
        imageUrls: ['https://example.com/dao.png'],
        summary: '更新后的 Dao 文章概览',
      },
    )
    expect(result).toMatchObject({
      updated: true,
      chunkCount: 2,
    })
  })

  it('should pass summary when ingesting custom rag document', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(userDocsIngestionService.ingestCustom).mockResolvedValue({
      documentId: 'user-doc:dao:und',
      sourceId: 'dao',
      sourceScope: 'published',
      sourceVersion: 'upload:1',
      chunkCount: 1,
      fileName: 'Dao 核心原理',
      fileType: 'md',
      chunkingProfile: 'balanced',
      chunkSize: 500,
      chunkOverlap: 50,
      uploadedAt: '2026-06-12T08:00:00.000Z',
      vectorStoreBackend: 'milvus',
      vectorStoreSynced: true,
      vectorStoreWarning: null,
    })

    const result = await controller.ingestCustom({
      title: 'Dao 核心原理',
      content: '# Dao\n\n内容',
      contentType: 'tech_blog',
      scope: 'published',
      linkUrls: ['https://example.com/dao'],
      imageUrls: ['https://example.com/dao.png'],
      summary: '从 Dao 的视角理解系统、约束与协作。',
    })

    expect(vi.mocked(userDocsIngestionService.ingestCustom)).toHaveBeenCalledWith({
      title: 'Dao 核心原理',
      content: '# Dao\n\n内容',
      contentType: 'tech_blog',
      sourceScope: 'published',
      linkUrls: ['https://example.com/dao'],
      imageUrls: ['https://example.com/dao.png'],
      summary: '从 Dao 的视角理解系统、约束与协作。',
    })
    expect(result).toMatchObject({
      documentId: 'user-doc:dao:und',
      chunkCount: 1,
    })
  })

  it('should export current user_docs snapshot', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(userDocsIngestionService.exportUserDocs).mockResolvedValue({
      exportedAt: '2026-06-15T08:00:00.000Z',
      documentCount: 2,
      documents: [],
    })

    const result = await controller.exportUserDocs()

    expect(vi.mocked(userDocsIngestionService.exportUserDocs)).toHaveBeenCalledTimes(1)
    expect(result.documentCount).toBe(2)
  })

  it('should reset current user_docs snapshot', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )
    vi.mocked(userDocsIngestionService.resetUserDocs).mockResolvedValue({
      resetAt: '2026-06-15T08:00:00.000Z',
      deletedDocumentIds: ['user-doc:dao:und'],
      deletedVectorDocumentIds: ['user-doc:dao:und'],
      backend: 'milvus',
    })

    const result = await controller.resetUserDocs()

    expect(vi.mocked(userDocsIngestionService.resetUserDocs)).toHaveBeenCalledTimes(1)
    expect(result.deletedDocumentIds).toEqual(['user-doc:dao:und'])
  })

  it('should reject blank custom document content on update', async () => {
    const controller = new RagController(
      ragService as never,
      resumeRagSyncService as never,
      userDocsIngestionService as never,
    )

    expect(() =>
      controller.updateCustom('user-doc:dao:und', {
        content: '   ',
      }),
    ).toThrow('内容不能为空')
  })
})

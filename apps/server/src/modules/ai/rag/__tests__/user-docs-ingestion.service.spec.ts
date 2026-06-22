import { describe, expect, it, vi } from 'vitest'

import { AiService } from '../../ai.service'
import { FileExtractionService } from '../../file-extraction.service'
import { RagRetrievalRepository } from '../rag-retrieval.repository'
import { RagVectorStore } from '../vector-store/types'
import {
  buildUserDocSourceVersion,
  splitUserDocTextIntoChunks,
  UserDocsIngestionService,
} from '../user-docs-ingestion.service'

function createHarness() {
  const fileExtractionService = {
    extractText: vi.fn(),
  } as unknown as FileExtractionService

  const aiService = {
    embedTexts: vi.fn(),
    generateText: vi.fn(),
  } as unknown as AiService

  const ragRetrievalRepository = {
    createIndexRun: vi.fn(),
    upsertDocument: vi.fn(),
    replaceChunksForDocument: vi.fn(),
    updateIndexRunStatus: vi.fn(),
    listAllDocuments: vi.fn().mockResolvedValue([]),
    listAllChunksWithDocuments: vi.fn().mockResolvedValue([]),
    listChunksByDocumentId: vi.fn().mockResolvedValue([]),
    findDocumentById: vi.fn(),
    updateDocumentById: vi.fn(),
    deleteDocument: vi.fn(),
  } as unknown as RagRetrievalRepository

  const ragVectorStore = {
    backend: 'local',
    upsertChunks: vi.fn(),
    deleteChunksByDocument: vi.fn(),
    listDocumentIds: vi.fn().mockResolvedValue([]),
    search: vi.fn(),
  } as unknown as RagVectorStore

  const service = new UserDocsIngestionService(
    fileExtractionService,
    aiService,
    ragRetrievalRepository,
    ragVectorStore,
  )

  return {
    service,
    fileExtractionService,
    aiService,
    ragRetrievalRepository,
    ragVectorStore,
  }
}

describe('UserDocsIngestionService', () => {
  it('should generate stable upload sourceVersion', () => {
    const uploadedAt = '2026-04-22T03:45:00.000Z'
    const expectedVersion = `upload:${new Date(uploadedAt).getTime()}`

    expect(buildUserDocSourceVersion(uploadedAt)).toBe(expectedVersion)
  })

  it('should split text into overlap chunks', () => {
    const text = 'A'.repeat(1200)
    const chunks = splitUserDocTextIntoChunks(text, 500, 100)

    expect(chunks.length).toBe(3)
    expect(chunks[0]?.length).toBe(500)
    expect(chunks[1]?.startsWith('A'.repeat(100))).toBe(true)
  })

  it('should ingest extracted file into retrieval tables with metadata', async () => {
    const { service, fileExtractionService, aiService, ragRetrievalRepository, ragVectorStore } =
      createHarness()

    vi.mocked(fileExtractionService.extractText).mockResolvedValue({
      fileName: 'rag-notes.md',
      fileType: 'md',
      mimeType: 'text/markdown',
      text: '段落一\n\n段落二\n\n段落三\n\n段落四',
      charCount: 20,
    })

    vi.mocked(aiService.embedTexts).mockResolvedValue({
      provider: 'mock',
      model: 'mock-resume-advisor-embedding',
      embeddings: [[0.1, 0.2], [0.3, 0.4]],
      raw: null,
    })

    const uploadedAt = new Date('2026-04-22T03:45:00.000Z')
    const expectedVersion = `upload:${uploadedAt.getTime()}`
    const result = await service.ingest({
      buffer: Buffer.from('fake'),
      originalname: 'rag-notes.md',
      mimetype: 'text/markdown',
      size: 4,
      uploadedAt,
    })

    expect(result.sourceScope).toBe('draft')
    expect(result.sourceVersion).toBe(expectedVersion)
    expect(result.fileName).toBe('rag-notes.md')
    expect(result.chunkingProfile).toBe('balanced')
    expect(result.chunkSize).toBe(500)
    expect(result.chunkOverlap).toBe(50)

    expect(vi.mocked(ragRetrievalRepository.createIndexRun)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.createIndexRun).mock.calls[0]?.[0],
    ).toMatchObject({
      sourceType: 'user_docs',
      sourceScope: 'draft',
      sourceVersion: expectedVersion,
      status: 'pending',
    })

    expect(vi.mocked(ragRetrievalRepository.upsertDocument)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.upsertDocument).mock.calls[0]?.[0],
    ).toMatchObject({
      sourceType: 'user_docs',
      sourceScope: 'draft',
      locale: 'und',
      metadataJson: {
        sourceType: 'user_docs',
        fileName: 'rag-notes.md',
        fileType: 'md',
        mimeType: 'text/markdown',
        knowledgeDomain: 'writing_media',
        contentType: 'general',
        sourceCollection: 'user_docs',
        renderHint: 'article_card',
        chunkingProfile: 'balanced',
        chunkSize: 500,
        chunkOverlap: 50,
        uploadedAt: uploadedAt.toISOString(),
      },
    })

    expect(vi.mocked(ragRetrievalRepository.replaceChunksForDocument)).toHaveBeenCalledTimes(1)
    const [documentId, chunks] =
      vi.mocked(ragRetrievalRepository.replaceChunksForDocument).mock.calls[0] ?? []

    expect(documentId).toMatch(/^user-doc:/)
    expect(Array.isArray(chunks)).toBe(true)
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0]).toMatchObject({
      section: 'user_docs',
      metadataJson: {
        sourceType: 'user_docs',
        fileName: 'rag-notes.md',
        knowledgeDomain: 'writing_media',
        contentType: 'general',
        sourceCollection: 'user_docs',
        renderHint: 'article_card',
        chunkingProfile: 'balanced',
        chunkSize: 500,
        chunkOverlap: 50,
        chunkIndex: 0,
      },
    })
    expect(vi.mocked(ragVectorStore.deleteChunksByDocument)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ragVectorStore.deleteChunksByDocument)).toHaveBeenCalledWith(documentId)
    expect(vi.mocked(ragVectorStore.upsertChunks)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ragVectorStore.upsertChunks).mock.calls[0]?.[0][0]).toMatchObject({
      sourceType: 'user_docs',
      sourceScope: 'draft',
      sourceVersion: expectedVersion,
      section: 'user_docs',
      metadataJson: {
        fileName: 'rag-notes.md',
        sourceType: 'user_docs',
        knowledgeDomain: 'writing_media',
        contentType: 'general',
        sourceCollection: 'user_docs',
        renderHint: 'article_card',
        chunkingProfile: 'balanced',
        chunkSize: 500,
        chunkOverlap: 50,
        chunkIndex: 0,
      },
    })

    expect(vi.mocked(ragRetrievalRepository.updateIndexRunStatus)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.updateIndexRunStatus).mock.calls[0]?.[0],
    ).toMatchObject({
      status: 'succeeded',
      errorMessage: null,
    })
  })

  it('should use contextual profile chunking when requested', async () => {
    const { service, fileExtractionService, aiService } = createHarness()

    vi.mocked(fileExtractionService.extractText).mockResolvedValue({
      fileName: 'long-notes.md',
      fileType: 'md',
      mimeType: 'text/markdown',
      text: 'A'.repeat(2400),
      charCount: 2400,
    })
    vi.mocked(aiService.embedTexts).mockImplementation(async ({ texts }) => ({
      provider: 'mock',
      model: 'mock-resume-advisor-embedding',
      embeddings: texts.map(() => [0.1, 0.2]),
      raw: null,
    }))

    const result = await service.ingest({
      buffer: Buffer.from('fake'),
      originalname: 'long-notes.md',
      mimetype: 'text/markdown',
      size: 4,
      chunkingProfile: 'contextual',
    })

    expect(result.chunkingProfile).toBe('contextual')
    expect(result.chunkSize).toBe(1000)
    expect(result.chunkOverlap).toBe(100)
    expect(result.chunkCount).toBe(3)
  })

  it('should use custom chunking numbers when provided', async () => {
    const { service, fileExtractionService, aiService, ragRetrievalRepository, ragVectorStore } =
      createHarness()

    vi.mocked(fileExtractionService.extractText).mockResolvedValue({
      fileName: 'structured-resume.md',
      fileType: 'md',
      mimeType: 'text/markdown',
      text: 'A'.repeat(240),
      charCount: 240,
    })
    vi.mocked(aiService.embedTexts).mockImplementation(async ({ texts }) => ({
      provider: 'mock',
      model: 'mock-resume-advisor-embedding',
      embeddings: texts.map(() => [0.1, 0.2]),
      raw: null,
    }))

    const result = await service.ingest({
      buffer: Buffer.from('fake'),
      originalname: 'structured-resume.md',
      mimetype: 'text/markdown',
      size: 4,
      chunkingProfile: 'balanced',
      chunkSize: 80,
      chunkOverlap: 10,
      contentType: 'hobby',
    })

    expect(result.chunkingProfile).toBe('balanced')
    expect(result.chunkSize).toBe(80)
    expect(result.chunkOverlap).toBe(10)
    expect(result.chunkCount).toBe(4)
    expect(
      vi.mocked(ragRetrievalRepository.upsertDocument).mock.calls[0]?.[0],
    ).toMatchObject({
      metadataJson: {
        chunkingProfile: 'balanced',
        chunkSize: 80,
        chunkOverlap: 10,
        knowledgeDomain: 'hobbies',
        contentType: 'hobby',
        sourceCollection: 'user_docs',
        renderHint: 'hobby_card',
      },
    })
    expect(vi.mocked(ragVectorStore.upsertChunks).mock.calls[0]?.[0][0]).toMatchObject({
      metadataJson: {
        chunkingProfile: 'balanced',
        chunkSize: 80,
        chunkOverlap: 10,
        knowledgeDomain: 'hobbies',
        contentType: 'hobby',
        sourceCollection: 'user_docs',
        renderHint: 'hobby_card',
      },
    })
  })

  it('should keep sqlite ingestion succeeded when vector sync is unavailable', async () => {
    const { service, fileExtractionService, aiService, ragRetrievalRepository, ragVectorStore } =
      createHarness()

    vi.mocked(fileExtractionService.extractText).mockResolvedValue({
      fileName: 'rag-notes.md',
      fileType: 'md',
      mimeType: 'text/markdown',
      text: '段落一\n\n段落二',
      charCount: 8,
    })
    vi.mocked(aiService.embedTexts).mockResolvedValue({
      provider: 'mock',
      model: 'mock-resume-advisor-embedding',
      embeddings: [[0.1, 0.2]],
      raw: null,
    })
    vi.mocked(ragVectorStore.deleteChunksByDocument).mockRejectedValue(
      new Error('Milvus unavailable'),
    )

    const result = await service.ingest({
      buffer: Buffer.from('fake'),
      originalname: 'rag-notes.md',
      mimetype: 'text/markdown',
      size: 4,
    })

    expect(result.documentId).toMatch(/^user-doc:/)
    expect(result.vectorStoreBackend).toBe('local')
    expect(result.vectorStoreSynced).toBe(false)
    expect(result.vectorStoreWarning).toContain('Milvus unavailable')
    expect(vi.mocked(ragRetrievalRepository.replaceChunksForDocument)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.updateIndexRunStatus).mock.calls.at(-1)?.[0],
    ).toMatchObject({
      status: 'succeeded',
      errorMessage: null,
    })
  })

  it('should persist custom rich card metadata for user docs cards', async () => {
    const { service, aiService, ragRetrievalRepository, ragVectorStore } = createHarness()

    vi.mocked(aiService.embedTexts).mockResolvedValue({
      provider: 'mock',
      model: 'mock-resume-advisor-embedding',
      embeddings: [[0.1, 0.2]],
      raw: null,
    })
    vi.mocked(aiService.generateText).mockResolvedValue({
      provider: 'mock',
      model: 'mock-chat',
      text: '羽毛球和音乐共同构成工作之外的节奏调节。',
      raw: null,
    })

    const result = await service.ingestCustom({
      title: '羽毛球与音乐',
      content: '羽毛球训练反应速度，音乐用于调节工作节奏。',
      contentType: 'hobby',
      linkUrls: ['https://example.com/hobbies', 'https://example.com/badminton'],
      imageUrls: ['https://example.com/hobby.png', 'https://example.com/music.png'],
      sourceScope: 'published',
    })

    expect(result.sourceScope).toBe('published')
    expect(vi.mocked(ragRetrievalRepository.upsertDocument)).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '羽毛球与音乐',
        metadataJson: expect.objectContaining({
          contentType: 'hobby',
          knowledgeDomain: 'hobbies',
          renderHint: 'hobby_card',
          rawLinkUrls: ['https://example.com/hobbies', 'https://example.com/badminton'],
          rawImageUrls: ['https://example.com/hobby.png', 'https://example.com/music.png'],
          articleSummary: '羽毛球和音乐共同构成工作之外的节奏调节。',
          richCard: expect.objectContaining({
            title: '羽毛球与音乐',
            description: '羽毛球和音乐共同构成工作之外的节奏调节。',
            summary: '羽毛球和音乐共同构成工作之外的节奏调节。',
            url: 'https://example.com/hobbies',
            urls: ['https://example.com/hobbies', 'https://example.com/badminton'],
            imageUrl: 'https://example.com/hobby.png',
            imageUrls: ['https://example.com/hobby.png', 'https://example.com/music.png'],
            keywords: [],
          }),
        }),
      }),
    )
    expect(
      vi.mocked(ragRetrievalRepository.replaceChunksForDocument).mock.calls[0]?.[1][0],
    ).toMatchObject({
      metadataJson: {
        articleSummary: '羽毛球和音乐共同构成工作之外的节奏调节。',
        richCard: expect.objectContaining({
          title: '羽毛球与音乐',
          summary: '羽毛球和音乐共同构成工作之外的节奏调节。',
          url: 'https://example.com/hobbies',
          imageUrl: 'https://example.com/hobby.png',
        }),
      },
    })
    expect(vi.mocked(ragVectorStore.deleteChunksByDocument)).toHaveBeenCalledWith(result.documentId)
    expect(vi.mocked(ragVectorStore.upsertChunks)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ragVectorStore.upsertChunks).mock.calls[0]?.[0][0]).toMatchObject({
      documentId: result.documentId,
      metadataJson: {
        richCard: {
          title: '羽毛球与音乐',
          summary: '羽毛球和音乐共同构成工作之外的节奏调节。',
          url: 'https://example.com/hobbies',
          imageUrl: 'https://example.com/hobby.png',
        },
      },
    })
    expect(vi.mocked(aiService.generateText)).toHaveBeenCalledTimes(1)
  })

  it('should return editable document detail for custom user docs', async () => {
    const { service, ragRetrievalRepository } = createHarness()

    vi.mocked(ragRetrievalRepository.findDocumentById).mockResolvedValue({
      id: 'user-doc:dao:und',
      title: 'Dao 核心原理',
      sourceType: 'user_docs',
      sourceScope: 'published',
      sourceId: 'dao',
      sourceVersion: 'upload:1',
      locale: 'und',
      contentHash: 'hash',
      metadataJson: {
        ingestMode: 'custom',
        contentType: 'tech_blog',
        rawContent: '# Dao\n\n核心原理摘要',
        rawLinkUrl: 'https://example.com/dao',
        rawLinkUrls: ['https://example.com/dao', 'https://example.com/dao-source'],
        rawImageUrls: ['https://example.com/dao.png'],
        articleSummary: '从 Dao 的视角理解系统、约束与协作关系。',
        richCard: {
          title: 'Dao 核心原理',
          summary: '从 Dao 的视角理解系统、约束与协作关系。',
          url: 'https://example.com/dao',
        },
      },
      createdAt: new Date('2026-06-12T08:00:00.000Z'),
      updatedAt: new Date('2026-06-12T08:30:00.000Z'),
    } as never)
    vi.mocked(ragRetrievalRepository.listChunksByDocumentId).mockResolvedValue([
      {
        chunkId: 'user-doc:dao:und:chunk:1',
        documentId: 'user-doc:dao:und',
        chunkIndex: 0,
        section: 'user_docs',
        content: '# Dao\n\n核心原理摘要',
        embeddingJson: [0.1, 0.2],
        metadataJson: {},
        documentMetadataJson: {},
        documentSourceType: 'user_docs',
        documentSourceScope: 'published',
        documentTitle: 'Dao 核心原理',
        documentSourceVersion: 'upload:1',
      },
    ] as never)

    const detail = await service.getDocumentDetail('user-doc:dao:und')

    expect(detail).toMatchObject({
      id: 'user-doc:dao:und',
      title: 'Dao 核心原理',
      contentType: 'tech_blog',
      content: '# Dao\n\n核心原理摘要',
      linkUrl: 'https://example.com/dao',
      linkUrls: ['https://example.com/dao', 'https://example.com/dao-source'],
      imageUrls: ['https://example.com/dao.png'],
      summary: '从 Dao 的视角理解系统、约束与协作关系。',
      editable: true,
      chunkCount: 1,
    })
  })

  it('should update custom document in place and resync chunks/vectors', async () => {
    const { service, aiService, ragRetrievalRepository, ragVectorStore } = createHarness()

    vi.mocked(ragRetrievalRepository.findDocumentById).mockResolvedValue({
      id: 'user-doc:dao:und',
      title: 'Dao 核心原理',
      sourceType: 'user_docs',
      sourceScope: 'published',
      sourceId: 'dao',
      sourceVersion: 'upload:1',
      locale: 'und',
      contentHash: 'hash',
      metadataJson: {
        ingestMode: 'custom',
        contentType: 'tech_blog',
        chunkingProfile: 'balanced',
        chunkSize: 500,
        chunkOverlap: 50,
        uploadedAt: '2026-06-12T08:00:00.000Z',
        rawContent: '# Dao\n\n旧内容',
        rawLinkUrl: 'https://example.com/old',
        articleSummary: '旧版本概览',
        richCard: {
          title: 'Dao 核心原理',
          summary: '旧版本概览',
          url: 'https://example.com/old',
        },
      },
      createdAt: new Date('2026-06-12T08:00:00.000Z'),
      updatedAt: new Date('2026-06-12T08:30:00.000Z'),
    } as never)
    vi.mocked(ragRetrievalRepository.listChunksByDocumentId).mockResolvedValue([
      {
        chunkId: 'user-doc:dao:und:chunk:1',
        documentId: 'user-doc:dao:und',
        chunkIndex: 0,
        section: 'user_docs',
        content: '# Dao\n\n旧内容',
        embeddingJson: [0.1, 0.2],
        metadataJson: {},
        documentMetadataJson: {},
        documentSourceType: 'user_docs',
        documentSourceScope: 'published',
        documentTitle: 'Dao 核心原理',
        documentSourceVersion: 'upload:1',
      },
    ] as never)
    vi.mocked(aiService.embedTexts).mockResolvedValue({
      provider: 'mock',
      model: 'mock-resume-advisor-embedding',
      embeddings: [[0.1, 0.2]],
      raw: null,
    })

    const result = await service.updateCustom('user-doc:dao:und', {
      title: 'Dao 核心原理 v2',
      content: '# Dao\n\n更新后的内容',
      contentType: 'tech_blog',
      sourceScope: 'published',
      linkUrls: ['https://example.com/new', 'https://example.com/new-2'],
      imageUrls: ['https://example.com/new.png'],
      summary: '更新后的 Dao 文章概览',
    })

    expect(vi.mocked(ragRetrievalRepository.updateDocumentById)).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'user-doc:dao:und',
        title: 'Dao 核心原理 v2',
        sourceScope: 'published',
        metadataJson: expect.objectContaining({
          ingestMode: 'custom',
          rawContent: '# Dao\n\n更新后的内容',
          rawLinkUrl: 'https://example.com/new',
          rawLinkUrls: ['https://example.com/new', 'https://example.com/new-2'],
          rawImageUrls: ['https://example.com/new.png'],
          articleSummary: '更新后的 Dao 文章概览',
          richCard: expect.objectContaining({
            summary: '更新后的 Dao 文章概览',
          }),
        }),
      }),
    )
    expect(vi.mocked(ragRetrievalRepository.replaceChunksForDocument)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ragVectorStore.deleteChunksByDocument)).toHaveBeenCalledWith('user-doc:dao:und')
    expect(vi.mocked(ragVectorStore.upsertChunks)).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      updated: true,
      documentId: 'user-doc:dao:und',
      vectorStoreSynced: true,
    })
  })

  it('should reject updating non-custom user docs', async () => {
    const { service, ragRetrievalRepository, ragVectorStore } = createHarness()

    vi.mocked(ragRetrievalRepository.findDocumentById).mockResolvedValue({
      id: 'user-doc:file:und',
      title: '上传文件',
      sourceType: 'user_docs',
      sourceScope: 'published',
      sourceId: 'file',
      sourceVersion: 'upload:1',
      locale: 'und',
      contentHash: 'hash',
      metadataJson: {
        fileName: 'upload.md',
        fileType: 'md',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never)

    await expect(
      service.updateCustom('user-doc:file:und', {
        content: '新内容',
      }),
    ).rejects.toThrow('Only custom user_docs can be edited')
    expect(vi.mocked(ragRetrievalRepository.updateDocumentById)).not.toHaveBeenCalled()
    expect(vi.mocked(ragVectorStore.upsertChunks)).not.toHaveBeenCalled()
  })

  it('should stop document deletion when vector cleanup fails', async () => {
    const { service, ragRetrievalRepository, ragVectorStore } = createHarness()

    vi.mocked(ragVectorStore.deleteChunksByDocument).mockRejectedValue(
      new Error('Milvus delete failed'),
    )

    await expect(service.deleteDocument('user-doc:dao')).rejects.toThrow('Milvus delete failed')
    expect(vi.mocked(ragRetrievalRepository.deleteDocument)).not.toHaveBeenCalled()
  })

  it('should reconcile user_docs vectors from database truth source', async () => {
    const { service, ragRetrievalRepository, ragVectorStore } = createHarness()

    vi.mocked(ragVectorStore.listDocumentIds).mockResolvedValue([
      'user-doc:dao',
      'user-doc:orphan',
    ])
    vi.mocked(ragRetrievalRepository.listAllDocuments).mockResolvedValue([
      {
        id: 'user-doc:dao',
        title: '《Dao》核心原理',
        sourceType: 'user_docs',
        sourceScope: 'published',
        sourceVersion: 'upload:1',
        locale: 'und',
        metadataJson: { contentType: 'tech_blog' },
        createdAt: new Date(),
        updatedAt: new Date(),
        previewContent: '只有标题和短描述',
      },
    ] as never)
    vi.mocked(ragRetrievalRepository.listAllChunksWithDocuments).mockResolvedValue([
      {
        chunkId: 'user-doc-chunk:dao:1',
        documentId: 'user-doc:dao',
        chunkIndex: 0,
        section: 'user_docs',
        content: '只有标题和短描述',
        embeddingJson: [0.1, 0.2],
        metadataJson: { fileName: 'dao.md', contentType: 'tech_blog' },
        documentMetadataJson: { contentType: 'tech_blog' },
        documentSourceType: 'user_docs',
        documentSourceScope: 'published',
        documentTitle: '《Dao》核心原理',
        documentSourceVersion: 'upload:1',
      },
    ] as never)

    const result = await service.reconcileUserDocsVectors()

    expect(vi.mocked(ragVectorStore.deleteChunksByDocument)).toHaveBeenCalledWith('user-doc:orphan')
    expect(vi.mocked(ragVectorStore.deleteChunksByDocument)).toHaveBeenCalledWith('user-doc:dao')
    expect(vi.mocked(ragVectorStore.upsertChunks)).toHaveBeenCalledWith([
      expect.objectContaining({
        documentId: 'user-doc:dao',
        sourceScope: 'published',
        sourceVersion: 'upload:1',
      }),
    ])
    expect(result).toEqual({
      backend: 'local',
      dbDocumentCount: 1,
      vectorDocumentCountBefore: 2,
      deletedOrphans: ['user-doc:orphan'],
      reindexedDocuments: ['user-doc:dao'],
      warnings: ['local backend does not persist user_docs vectors; reconcile completed as a no-op.'],
    })
  })

  it('should reject reconcile when vector backend is snapshot', async () => {
    const { service, ragVectorStore } = createHarness()

    ;(ragVectorStore as { backend: string }).backend = 'snapshot'

    await expect(service.reconcileUserDocsVectors()).rejects.toThrow(
      'user_docs vector reconcile is not supported when backend=snapshot',
    )
    expect(vi.mocked(ragVectorStore.listDocumentIds)).not.toHaveBeenCalled()
  })

  it('should mark run failed when embedding throws', async () => {
    const { service, fileExtractionService, aiService, ragRetrievalRepository, ragVectorStore } =
      createHarness()

    vi.mocked(fileExtractionService.extractText).mockResolvedValue({
      fileName: 'rag-notes.md',
      fileType: 'md',
      mimeType: 'text/markdown',
      text: '段落一\n\n段落二',
      charCount: 10,
    })
    vi.mocked(aiService.embedTexts).mockRejectedValue(new Error('embed failed'))

    await expect(
      service.ingest({
        buffer: Buffer.from('fake'),
        originalname: 'rag-notes.md',
        mimetype: 'text/markdown',
        size: 4,
      }),
    ).rejects.toThrow('embed failed')

    expect(vi.mocked(ragRetrievalRepository.updateIndexRunStatus)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.updateIndexRunStatus).mock.calls[0]?.[0],
    ).toMatchObject({
      status: 'failed',
      errorMessage: 'embed failed',
    })
    expect(vi.mocked(ragVectorStore.upsertChunks)).not.toHaveBeenCalled()
  })
})

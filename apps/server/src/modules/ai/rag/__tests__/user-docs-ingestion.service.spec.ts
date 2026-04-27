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
  } as unknown as AiService

  const ragRetrievalRepository = {
    createIndexRun: vi.fn(),
    upsertDocument: vi.fn(),
    replaceChunksForDocument: vi.fn(),
    updateIndexRunStatus: vi.fn(),
  } as unknown as RagRetrievalRepository

  const ragVectorStore = {
    backend: 'local',
    upsertChunks: vi.fn(),
    deleteChunksByDocument: vi.fn(),
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

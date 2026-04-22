import { describe, expect, it, vi } from 'vitest'

import { AiService } from '../../ai.service'
import { FileExtractionService } from '../../file-extraction.service'
import { RagRetrievalRepository } from '../rag-retrieval.repository'
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

  const service = new UserDocsIngestionService(
    fileExtractionService,
    aiService,
    ragRetrievalRepository,
  )

  return {
    service,
    fileExtractionService,
    aiService,
    ragRetrievalRepository,
  }
}

describe('UserDocsIngestionService', () => {
  it('should generate stable upload sourceVersion', () => {
    const uploadedAt = '2026-04-22T03:45:00.000Z'

    expect(buildUserDocSourceVersion(uploadedAt)).toBe('upload:1776839100000')
  })

  it('should split text into overlap chunks', () => {
    const text = 'A'.repeat(1200)
    const chunks = splitUserDocTextIntoChunks(text, 500, 100)

    expect(chunks.length).toBe(3)
    expect(chunks[0]?.length).toBe(500)
    expect(chunks[1]?.startsWith('A'.repeat(100))).toBe(true)
  })

  it('should ingest extracted file into retrieval tables with metadata', async () => {
    const { service, fileExtractionService, aiService, ragRetrievalRepository } = createHarness()

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
    const result = await service.ingest({
      buffer: Buffer.from('fake'),
      originalname: 'rag-notes.md',
      mimetype: 'text/markdown',
      size: 4,
      uploadedAt,
    })

    expect(result.sourceScope).toBe('draft')
    expect(result.sourceVersion).toBe('upload:1776839100000')
    expect(result.fileName).toBe('rag-notes.md')

    expect(vi.mocked(ragRetrievalRepository.createIndexRun)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.createIndexRun).mock.calls[0]?.[0],
    ).toMatchObject({
      sourceType: 'user_docs',
      sourceScope: 'draft',
      sourceVersion: 'upload:1776839100000',
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

  it('should mark run failed when embedding throws', async () => {
    const { service, fileExtractionService, aiService, ragRetrievalRepository } = createHarness()

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
  })
})

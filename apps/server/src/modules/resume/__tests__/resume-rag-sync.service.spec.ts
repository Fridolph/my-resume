import { describe, expect, it, vi } from 'vitest'

import { createExampleStandardResume } from '../domain/standard-resume'
import { ResumeMarkdownExportService } from '../resume-markdown-export.service'
import { ResumePublicationRepository } from '../resume-publication.repository'
import {
  buildDraftSourceVersion,
  buildPublishedSourceVersion,
  ResumeRagSyncService,
} from '../resume-rag-sync.service'
import { RagRetrievalRepository } from '../../ai/rag/rag-retrieval.repository'

function createServiceHarness() {
  const resumePublicationRepository = {
    findDraft: vi.fn(),
    findLatestPublishedSnapshot: vi.fn(),
  } as unknown as ResumePublicationRepository

  const resumeMarkdownExportService = {
    render: vi.fn(),
  } as unknown as ResumeMarkdownExportService

  const ragRetrievalRepository = {
    createIndexRun: vi.fn(),
    upsertDocument: vi.fn(),
    replaceChunksForDocument: vi.fn(),
    updateIndexRunStatus: vi.fn(),
  } as unknown as RagRetrievalRepository

  const service = new ResumeRagSyncService(
    resumePublicationRepository,
    resumeMarkdownExportService,
    ragRetrievalRepository,
  )

  return {
    service,
    resumePublicationRepository,
    resumeMarkdownExportService,
    ragRetrievalRepository,
  }
}

describe('ResumeRagSyncService', () => {
  it('should build stable sourceVersion keys for draft and published', () => {
    const updatedAt = '2026-04-22T01:23:45.000Z'
    const publishedAt = '2026-04-22T02:23:45.000Z'

    expect(buildDraftSourceVersion(updatedAt)).toBe('draft:1776821025000')
    expect(buildPublishedSourceVersion(publishedAt)).toBe('published:1776824625000')
  })

  it('should sync draft snapshot into retrieval documents and chunks', async () => {
    const { service, resumeMarkdownExportService, ragRetrievalRepository } =
      createServiceHarness()
    const resume = createExampleStandardResume()

    vi.mocked(resumeMarkdownExportService.render).mockImplementation(
      (_resume, locale) => `# ${locale} resume`,
    )

    await service.syncDraft(resume, '2026-04-22T01:23:45.000Z')

    expect(vi.mocked(ragRetrievalRepository.createIndexRun)).toHaveBeenCalledTimes(1)
    expect(vi.mocked(ragRetrievalRepository.upsertDocument)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(ragRetrievalRepository.replaceChunksForDocument)).toHaveBeenCalledTimes(2)
    expect(vi.mocked(ragRetrievalRepository.updateIndexRunStatus)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.updateIndexRunStatus).mock.calls[0]?.[0],
    ).toMatchObject({
      status: 'succeeded',
      chunkCount: 2,
      errorMessage: null,
    })
  })

  it('should mark run as failed when sync process throws', async () => {
    const { service, resumeMarkdownExportService, ragRetrievalRepository } =
      createServiceHarness()
    const resume = createExampleStandardResume()

    vi.mocked(resumeMarkdownExportService.render).mockImplementation(() => '# broken')
    vi.mocked(ragRetrievalRepository.upsertDocument).mockRejectedValueOnce(
      new Error('upsert failed'),
    )

    await expect(service.syncDraft(resume, '2026-04-22T01:23:45.000Z')).rejects.toThrow(
      'upsert failed',
    )
    expect(vi.mocked(ragRetrievalRepository.updateIndexRunStatus)).toHaveBeenCalledTimes(1)
    expect(
      vi.mocked(ragRetrievalRepository.updateIndexRunStatus).mock.calls[0]?.[0],
    ).toMatchObject({
      status: 'failed',
      errorMessage: 'upsert failed',
    })
  })

  it('should sync current snapshots by scope', async () => {
    const {
      service,
      resumePublicationRepository,
      resumeMarkdownExportService,
      ragRetrievalRepository,
    } = createServiceHarness()
    const resume = createExampleStandardResume()

    vi.mocked(resumeMarkdownExportService.render).mockImplementation(
      (_resume, locale) => `# ${locale} resume`,
    )
    vi.mocked(resumePublicationRepository.findDraft).mockResolvedValue({
      resumeJson: resume,
      updatedAt: new Date('2026-04-22T01:23:45.000Z'),
    } as Awaited<ReturnType<ResumePublicationRepository['findDraft']>>)
    vi.mocked(resumePublicationRepository.findLatestPublishedSnapshot).mockResolvedValue({
      resumeJson: resume,
      publishedAt: new Date('2026-04-22T02:23:45.000Z'),
    } as Awaited<ReturnType<ResumePublicationRepository['findLatestPublishedSnapshot']>>)

    const result = await service.syncCurrent('all')

    expect(result.draft.synced).toBe(true)
    expect(result.published.synced).toBe(true)
    expect(result.draft.sourceVersion).toBe('draft:1776821025000')
    expect(result.published.sourceVersion).toBe('published:1776824625000')
    expect(vi.mocked(ragRetrievalRepository.createIndexRun)).toHaveBeenCalledTimes(2)
  })
})

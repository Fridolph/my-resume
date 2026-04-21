import { createHash, randomUUID } from 'node:crypto'
import { Inject, Injectable } from '@nestjs/common'

import { STANDARD_RESUME_KEY } from '../../database/resume-records'
import type { StandardResume } from './domain/standard-resume'
import type { ResumeLocale } from './domain/standard-resume'
import { ResumePublicationRepository } from './resume-publication.repository'
import { ResumeMarkdownExportService } from './resume-markdown-export.service'
import type { RagSourceScope } from '../../database/schema'
import { RagRetrievalRepository } from '../ai/rag/rag-retrieval.repository'

export type ResumeRagSyncScope = RagSourceScope | 'all'

export interface ResumeRagSyncSummary {
  draft: {
    synced: boolean
    sourceVersion: string | null
  }
  published: {
    synced: boolean
    sourceVersion: string | null
  }
}

function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function toTimestampMilliseconds(value: Date | string): number {
  if (value instanceof Date) {
    return value.getTime()
  }

  return new Date(value).getTime()
}

function resolveResumeLocales(resume: StandardResume): ResumeLocale[] {
  const locales = resume.meta.locales.filter(
    (item): item is ResumeLocale => item === 'zh' || item === 'en',
  )

  if (locales.length > 0) {
    return locales
  }

  return [resume.meta.defaultLocale]
}

/**
 * 草稿态版本键生成规则。
 */
export function buildDraftSourceVersion(updatedAt: Date | string): string {
  return `draft:${toTimestampMilliseconds(updatedAt)}`
}

/**
 * 发布态版本键生成规则。
 */
export function buildPublishedSourceVersion(publishedAt: Date | string): string {
  return `published:${toTimestampMilliseconds(publishedAt)}`
}

@Injectable()
export class ResumeRagSyncService {
  constructor(
    @Inject(ResumePublicationRepository)
    private readonly resumePublicationRepository: ResumePublicationRepository,
    @Inject(ResumeMarkdownExportService)
    private readonly resumeMarkdownExportService: ResumeMarkdownExportService,
    @Inject(RagRetrievalRepository)
    private readonly ragRetrievalRepository: RagRetrievalRepository,
  ) {}

  /**
   * 同步当前简历到检索态索引（支持 draft/published/all）。
   *
   * @param scope 同步范围
   * @returns 同步摘要
   */
  async syncCurrent(scope: ResumeRagSyncScope = 'all'): Promise<ResumeRagSyncSummary> {
    const summary: ResumeRagSyncSummary = {
      draft: {
        synced: false,
        sourceVersion: null,
      },
      published: {
        synced: false,
        sourceVersion: null,
      },
    }

    if (scope === 'draft' || scope === 'all') {
      const draft = await this.resumePublicationRepository.findDraft()

      if (draft) {
        const sourceVersion = buildDraftSourceVersion(draft.updatedAt)

        await this.syncResumeSnapshot({
          sourceScope: 'draft',
          resume: draft.resumeJson,
          sourceVersion,
        })

        summary.draft = {
          synced: true,
          sourceVersion,
        }
      }
    }

    if (scope === 'published' || scope === 'all') {
      const published = await this.resumePublicationRepository.findLatestPublishedSnapshot()

      if (published) {
        const sourceVersion = buildPublishedSourceVersion(published.publishedAt)

        await this.syncResumeSnapshot({
          sourceScope: 'published',
          resume: published.resumeJson,
          sourceVersion,
        })

        summary.published = {
          synced: true,
          sourceVersion,
        }
      }
    }

    return summary
  }

  /**
   * 同步草稿态快照到检索态。
   *
   * @param resume 草稿简历
   * @param updatedAt 草稿更新时间
   * @returns sourceVersion
   */
  async syncDraft(resume: StandardResume, updatedAt: Date | string): Promise<string> {
    const sourceVersion = buildDraftSourceVersion(updatedAt)

    await this.syncResumeSnapshot({
      sourceScope: 'draft',
      resume,
      sourceVersion,
    })

    return sourceVersion
  }

  /**
   * 同步发布态快照到检索态。
   *
   * @param resume 发布简历
   * @param publishedAt 发布时间
   * @returns sourceVersion
   */
  async syncPublished(resume: StandardResume, publishedAt: Date | string): Promise<string> {
    const sourceVersion = buildPublishedSourceVersion(publishedAt)

    await this.syncResumeSnapshot({
      sourceScope: 'published',
      resume,
      sourceVersion,
    })

    return sourceVersion
  }

  private async syncResumeSnapshot(input: {
    sourceScope: RagSourceScope
    resume: StandardResume
    sourceVersion: string
  }) {
    const startedAt = new Date()
    const runId = randomUUID()

    await this.ragRetrievalRepository.createIndexRun({
      id: runId,
      sourceType: 'resume_core',
      sourceScope: input.sourceScope,
      sourceVersion: input.sourceVersion,
      status: 'pending',
      chunkCount: 0,
      errorMessage: null,
      startedAt,
      finishedAt: null,
      createdAt: startedAt,
      updatedAt: startedAt,
    })

    try {
      const locales = resolveResumeLocales(input.resume)
      let totalChunkCount = 0

      for (const locale of locales) {
        const markdown = this.resumeMarkdownExportService.render(input.resume, locale)
        const contentHash = computeContentHash(markdown)
        const now = new Date()
        const documentId = `resume-core:${input.sourceScope}:${input.sourceVersion}:${locale}`
        const title = `${input.resume.profile.fullName[locale]} / ${input.resume.profile.headline[locale]}`

        await this.ragRetrievalRepository.upsertDocument({
          id: documentId,
          sourceType: 'resume_core',
          sourceScope: input.sourceScope,
          sourceId: STANDARD_RESUME_KEY,
          sourceVersion: input.sourceVersion,
          locale,
          title,
          contentHash,
          metadataJson: {
            format: 'markdown',
          },
          createdAt: now,
          updatedAt: now,
        })

        await this.ragRetrievalRepository.replaceChunksForDocument(documentId, [
          {
            id: `${documentId}:chunk:0`,
            documentId,
            chunkIndex: 0,
            section: 'resume',
            content: markdown,
            contentHash,
            embeddingJson: [],
            metadataJson: {
              locale,
            },
            createdAt: now,
            updatedAt: now,
          },
        ])

        totalChunkCount += 1
      }

      await this.ragRetrievalRepository.updateIndexRunStatus({
        id: runId,
        status: 'succeeded',
        chunkCount: totalChunkCount,
        errorMessage: null,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error'

      await this.ragRetrievalRepository.updateIndexRunStatus({
        id: runId,
        status: 'failed',
        errorMessage,
        finishedAt: new Date(),
        updatedAt: new Date(),
      })

      throw error
    }
  }
}

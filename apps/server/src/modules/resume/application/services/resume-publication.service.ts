import {
  Inject,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common'

import {
  isSqliteLockedError,
  SQLITE_LOCKED_ERROR_MESSAGE,
} from '../../../../database/sqlite-lock'

import {
  createExampleStandardResume,
  normalizeStandardResume,
  StandardResume,
  type ResumeLocale,
} from '../../domain/standard-resume'
import { ResumePublicationRepository } from '../../infrastructure/repositories/resume-publication.repository'
import { ResumeRagSyncService } from './resume-rag-sync.service'
import type {
  ResumeDraftSnapshot,
  ResumeDraftSummarySnapshot,
  ResumePublishedSnapshot,
  ResumePublishedSummarySnapshot,
} from '../types/resume-snapshot.types'
import { buildResumeSummary } from './resume-summary'

function cloneStandardResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume
}

function toIsoTimestamp(value: Date | string): string {
  return typeof value === 'string' ? value : value.toISOString()
}

function toDraftSnapshot<TResume>(
  resume: TResume,
  updatedAt: Date | string,
): ResumeDraftSnapshot<TResume> {
  return {
    status: 'draft',
    resume,
    updatedAt: toIsoTimestamp(updatedAt),
  }
}

function toPublishedSnapshot<TResume>(
  resume: TResume,
  publishedAt: Date | string,
): ResumePublishedSnapshot<TResume> {
  return {
    status: 'published',
    resume,
    publishedAt: toIsoTimestamp(publishedAt),
  }
}

@Injectable()
export class ResumePublicationService {
  private readonly logger = new Logger(ResumePublicationService.name)

  constructor(
    @Inject(ResumePublicationRepository)
    private readonly resumePublicationRepository: ResumePublicationRepository,
    @Optional()
    @Inject(ResumeRagSyncService)
    private readonly resumeRagSyncService?: ResumeRagSyncService,
  ) {}

  /**
   * 读取草稿并在首次访问时自动初始化示例草稿
   * @returns 草稿快照
   */
  async getDraft(): Promise<ResumeDraftSnapshot> {
    return this.runWithDatabaseLockHint(async () => {
      // 首次进入时自动 seed 示例草稿，确保后台可直接编辑。
      const existingDraft = await this.resumePublicationRepository.findDraft()

      if (!existingDraft) {
        const seededDraft = await this.resumePublicationRepository.saveDraft(
          createExampleStandardResume(),
        )

        return toDraftSnapshot(
          normalizeStandardResume(cloneStandardResume(seededDraft.resumeJson)),
          seededDraft.updatedAt,
        )
      }

      return toDraftSnapshot(
        normalizeStandardResume(cloneStandardResume(existingDraft.resumeJson)),
        existingDraft.updatedAt,
      )
    })
  }

  /**
   * 读取草稿摘要
   * @param locale 摘要语言
   * @returns 草稿摘要快照
   */
  async getDraftSummary(locale: ResumeLocale): Promise<ResumeDraftSummarySnapshot> {
    const draft = await this.getDraft()

    return toDraftSnapshot(buildResumeSummary(draft.resume, locale), draft.updatedAt)
  }

  /**
   * 读取最新发布快照
   * @returns 发布态快照或 null
   */
  async getPublished(): Promise<ResumePublishedSnapshot | null> {
    const publishedSnapshot =
      await this.resumePublicationRepository.findLatestPublishedSnapshot()

    if (!publishedSnapshot) {
      return null
    }

    return toPublishedSnapshot(
      normalizeStandardResume(cloneStandardResume(publishedSnapshot.resumeJson)),
      publishedSnapshot.publishedAt,
    )
  }

  /**
   * 读取发布态摘要
   * @param locale 摘要语言
   * @returns 发布态摘要快照或 null
   */
  async getPublishedSummary(
    locale: ResumeLocale,
  ): Promise<ResumePublishedSummarySnapshot | null> {
    const published = await this.getPublished()

    if (!published) {
      return null
    }

    return toPublishedSnapshot(buildResumeSummary(published.resume, locale), published.publishedAt)
  }

  /**
   * 覆盖保存草稿位
   * @param resume 草稿内容
   * @returns 保存后的草稿快照
   */
  async updateDraft(resume: StandardResume): Promise<ResumeDraftSnapshot> {
    return this.runWithDatabaseLockHint(async () => {
      // updateDraft 只更新草稿位，不生成历史版本。
      const savedDraft = await this.resumePublicationRepository.saveDraft(
        normalizeStandardResume(cloneStandardResume(resume)),
      )
      await this.trySyncResumeRetrieval(() =>
        this.resumeRagSyncService?.syncDraft(savedDraft.resumeJson, savedDraft.updatedAt),
      )

      return toDraftSnapshot(
        normalizeStandardResume(cloneStandardResume(savedDraft.resumeJson)),
        savedDraft.updatedAt,
      )
    })
  }

  /**
   * 从当前草稿创建并返回新的发布快照
   * @returns 发布态快照
   */
  async publish(): Promise<ResumePublishedSnapshot> {
    return this.runWithDatabaseLockHint(async () => {
      // publish 语义：读取 draft 后写入发布快照表，公开站读取最后一条。
      const draft = await this.getDraft()
      const publishedSnapshot =
        await this.resumePublicationRepository.createPublishedSnapshot(
          cloneStandardResume(draft.resume),
        )
      await this.trySyncResumeRetrieval(() =>
        this.resumeRagSyncService?.syncPublished(
          publishedSnapshot.resumeJson,
          publishedSnapshot.publishedAt,
        ),
      )

      return toPublishedSnapshot(
        cloneStandardResume(publishedSnapshot.resumeJson),
        publishedSnapshot.publishedAt,
      )
    })
  }

  private async runWithDatabaseLockHint<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (isSqliteLockedError(error)) {
        throw new ServiceUnavailableException(SQLITE_LOCKED_ERROR_MESSAGE)
      }

      throw error
    }
  }

  private async trySyncResumeRetrieval(operation: () => Promise<unknown> | undefined) {
    try {
      await operation()
    } catch (error) {
      // 简历主链路优先保证可用；检索态失败可通过 index_runs 可观测并重试。
      const message = error instanceof Error ? error.message : String(error)

      this.logger.warn(`resume rag sync skipped: ${message}`)
    }
  }
}

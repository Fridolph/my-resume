import { Inject, Injectable, ServiceUnavailableException } from '@nestjs/common'

import {
  isSqliteLockedError,
  SQLITE_LOCKED_ERROR_MESSAGE,
} from '../../database/sqlite-lock'

import {
  createExampleStandardResume,
  normalizeStandardResume,
  StandardResume,
  type ResumeLocale,
} from './domain/standard-resume'
import { ResumePublicationRepository } from './resume-publication.repository'
import { buildResumeSummary, type ResumeSummary } from './resume-summary'

export interface ResumeDraftSnapshot {
  status: 'draft'
  resume: StandardResume
  updatedAt: string
}

export interface ResumePublishedSnapshot {
  status: 'published'
  resume: StandardResume
  publishedAt: string
}

export interface ResumeDraftSummarySnapshot {
  status: 'draft'
  resume: ResumeSummary
  updatedAt: string
}

export interface ResumePublishedSummarySnapshot {
  status: 'published'
  resume: ResumeSummary
  publishedAt: string
}

function cloneStandardResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume
}

@Injectable()
export class ResumePublicationService {
  constructor(
    @Inject(ResumePublicationRepository)
    private readonly resumePublicationRepository: ResumePublicationRepository,
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

        return {
          status: 'draft',
          resume: normalizeStandardResume(cloneStandardResume(seededDraft.resumeJson)),
          updatedAt: seededDraft.updatedAt.toISOString(),
        }
      }

      return {
        status: 'draft',
        resume: normalizeStandardResume(cloneStandardResume(existingDraft.resumeJson)),
        updatedAt: existingDraft.updatedAt.toISOString(),
      }
    })
  }

  /**
   * 读取草稿摘要
   * @param locale 摘要语言
   * @returns 草稿摘要快照
   */
  async getDraftSummary(locale: ResumeLocale): Promise<ResumeDraftSummarySnapshot> {
    const draft = await this.getDraft()

    return {
      status: draft.status,
      updatedAt: draft.updatedAt,
      resume: buildResumeSummary(draft.resume, locale),
    }
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

    return {
      status: 'published',
      resume: normalizeStandardResume(cloneStandardResume(publishedSnapshot.resumeJson)),
      publishedAt: publishedSnapshot.publishedAt.toISOString(),
    }
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

    return {
      status: published.status,
      publishedAt: published.publishedAt,
      resume: buildResumeSummary(published.resume, locale),
    }
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

      return {
        status: 'draft',
        resume: normalizeStandardResume(cloneStandardResume(savedDraft.resumeJson)),
        updatedAt: savedDraft.updatedAt.toISOString(),
      }
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

      return {
        status: 'published',
        resume: cloneStandardResume(publishedSnapshot.resumeJson),
        publishedAt: publishedSnapshot.publishedAt.toISOString(),
      }
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
}

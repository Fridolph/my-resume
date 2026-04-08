import {
  Inject,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';

import {
  isSqliteLockedError,
  SQLITE_LOCKED_ERROR_MESSAGE,
} from '../../database/sqlite-lock';

import {
  createExampleStandardResume,
  normalizeStandardResume,
  StandardResume,
  type ResumeLocale,
} from './domain/standard-resume';
import { ResumePublicationRepository } from './resume-publication.repository';
import {
  buildResumeSummary,
  type ResumeSummary,
} from './resume-summary';

export interface ResumeDraftSnapshot {
  status: 'draft';
  resume: StandardResume;
  updatedAt: string;
}

export interface ResumePublishedSnapshot {
  status: 'published';
  resume: StandardResume;
  publishedAt: string;
}

export interface ResumeDraftSummarySnapshot {
  status: 'draft';
  resume: ResumeSummary;
  updatedAt: string;
}

export interface ResumePublishedSummarySnapshot {
  status: 'published';
  resume: ResumeSummary;
  publishedAt: string;
}

function cloneStandardResume(resume: StandardResume): StandardResume {
  return JSON.parse(JSON.stringify(resume)) as StandardResume;
}

@Injectable()
export class ResumePublicationService {
  constructor(
    @Inject(ResumePublicationRepository)
    private readonly resumePublicationRepository: ResumePublicationRepository,
  ) {}

  async getDraft(): Promise<ResumeDraftSnapshot> {
    return this.runWithDatabaseLockHint(async () => {
      const existingDraft = await this.resumePublicationRepository.findDraft();

      if (!existingDraft) {
        const seededDraft = await this.resumePublicationRepository.saveDraft(
          createExampleStandardResume(),
        );

        return {
          status: 'draft',
          resume: normalizeStandardResume(cloneStandardResume(seededDraft.resumeJson)),
          updatedAt: seededDraft.updatedAt.toISOString(),
        };
      }

      return {
        status: 'draft',
        resume: normalizeStandardResume(cloneStandardResume(existingDraft.resumeJson)),
        updatedAt: existingDraft.updatedAt.toISOString(),
      };
    });
  }

  async getDraftSummary(locale: ResumeLocale): Promise<ResumeDraftSummarySnapshot> {
    const draft = await this.getDraft();

    return {
      status: draft.status,
      updatedAt: draft.updatedAt,
      resume: buildResumeSummary(draft.resume, locale),
    };
  }

  async getPublished(): Promise<ResumePublishedSnapshot | null> {
    const publishedSnapshot =
      await this.resumePublicationRepository.findLatestPublishedSnapshot();

    if (!publishedSnapshot) {
      return null;
    }

    return {
      status: 'published',
      resume: normalizeStandardResume(cloneStandardResume(publishedSnapshot.resumeJson)),
      publishedAt: publishedSnapshot.publishedAt.toISOString(),
    };
  }

  async getPublishedSummary(
    locale: ResumeLocale,
  ): Promise<ResumePublishedSummarySnapshot | null> {
    const published = await this.getPublished();

    if (!published) {
      return null;
    }

    return {
      status: published.status,
      publishedAt: published.publishedAt,
      resume: buildResumeSummary(published.resume, locale),
    };
  }

  async updateDraft(resume: StandardResume): Promise<ResumeDraftSnapshot> {
    return this.runWithDatabaseLockHint(async () => {
      const savedDraft = await this.resumePublicationRepository.saveDraft(
        normalizeStandardResume(cloneStandardResume(resume)),
      );

      return {
        status: 'draft',
        resume: normalizeStandardResume(cloneStandardResume(savedDraft.resumeJson)),
        updatedAt: savedDraft.updatedAt.toISOString(),
      };
    });
  }

  async publish(): Promise<ResumePublishedSnapshot> {
    return this.runWithDatabaseLockHint(async () => {
      const draft = await this.getDraft();
      const publishedSnapshot =
        await this.resumePublicationRepository.createPublishedSnapshot(
          cloneStandardResume(draft.resume),
        );

      return {
        status: 'published',
        resume: cloneStandardResume(publishedSnapshot.resumeJson),
        publishedAt: publishedSnapshot.publishedAt.toISOString(),
      };
    });
  }

  private async runWithDatabaseLockHint<T>(
    operation: () => Promise<T>,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (isSqliteLockedError(error)) {
        throw new ServiceUnavailableException(SQLITE_LOCKED_ERROR_MESSAGE);
      }

      throw error;
    }
  }
}

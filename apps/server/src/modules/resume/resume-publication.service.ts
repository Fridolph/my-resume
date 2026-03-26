import { Inject, Injectable } from '@nestjs/common';

import {
  createExampleStandardResume,
  StandardResume,
} from './domain/standard-resume';
import { ResumePublicationRepository } from './resume-publication.repository';

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
    const existingDraft = await this.resumePublicationRepository.findDraft();

    if (!existingDraft) {
      const seededDraft = await this.resumePublicationRepository.saveDraft(
        createExampleStandardResume(),
      );

      return {
        status: 'draft',
        resume: cloneStandardResume(seededDraft.resumeJson),
        updatedAt: seededDraft.updatedAt.toISOString(),
      };
    }

    return {
      status: 'draft',
      resume: cloneStandardResume(existingDraft.resumeJson),
      updatedAt: existingDraft.updatedAt.toISOString(),
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
      resume: cloneStandardResume(publishedSnapshot.resumeJson),
      publishedAt: publishedSnapshot.publishedAt.toISOString(),
    };
  }

  async updateDraft(resume: StandardResume): Promise<ResumeDraftSnapshot> {
    const savedDraft = await this.resumePublicationRepository.saveDraft(
      cloneStandardResume(resume),
    );

    return {
      status: 'draft',
      resume: cloneStandardResume(savedDraft.resumeJson),
      updatedAt: savedDraft.updatedAt.toISOString(),
    };
  }

  async publish(): Promise<ResumePublishedSnapshot> {
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
  }
}

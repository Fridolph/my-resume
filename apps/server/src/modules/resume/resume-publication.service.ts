import { Injectable } from '@nestjs/common';

import {
  createExampleStandardResume,
  StandardResume,
} from './domain/standard-resume';

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
  private draftSnapshot: ResumeDraftSnapshot = {
    status: 'draft',
    resume: createExampleStandardResume(),
    updatedAt: new Date().toISOString(),
  };

  private publishedSnapshot: ResumePublishedSnapshot | null = null;

  getDraft(): ResumeDraftSnapshot {
    return {
      ...this.draftSnapshot,
      resume: cloneStandardResume(this.draftSnapshot.resume),
    };
  }

  getPublished(): ResumePublishedSnapshot | null {
    if (!this.publishedSnapshot) {
      return null;
    }

    return {
      ...this.publishedSnapshot,
      resume: cloneStandardResume(this.publishedSnapshot.resume),
    };
  }

  updateDraft(resume: StandardResume): ResumeDraftSnapshot {
    this.draftSnapshot = {
      status: 'draft',
      resume: cloneStandardResume(resume),
      updatedAt: new Date().toISOString(),
    };

    return this.getDraft();
  }

  publish(): ResumePublishedSnapshot {
    this.publishedSnapshot = {
      status: 'published',
      resume: cloneStandardResume(this.draftSnapshot.resume),
      publishedAt: new Date().toISOString(),
    };

    return this.getPublished() as ResumePublishedSnapshot;
  }
}

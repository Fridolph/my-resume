import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';

import { DATABASE_INSTANCE } from '../../database/database.tokens';
import type { DatabaseInstance } from '../../database/database.client';
import {
  createResumeDraftRecord,
  createResumePublicationSnapshotRecord,
  STANDARD_RESUME_KEY,
} from '../../database/resume-records';
import {
  resumeDrafts,
  resumePublicationSnapshots,
} from '../../database/schema';
import type { StandardResume } from './domain/standard-resume';

@Injectable()
export class ResumePublicationRepository {
  constructor(
    @Inject(DATABASE_INSTANCE)
    private readonly database: DatabaseInstance,
  ) {}

  async findDraft() {
    const [record] = await this.database
      .select()
      .from(resumeDrafts)
      .where(eq(resumeDrafts.resumeKey, STANDARD_RESUME_KEY))
      .limit(1);

    return record ?? null;
  }

  async saveDraft(resume: StandardResume, updatedAt = new Date()) {
    const draftRecord = createResumeDraftRecord(resume, updatedAt);

    await this.database
      .insert(resumeDrafts)
      .values(draftRecord)
      .onConflictDoUpdate({
        target: resumeDrafts.resumeKey,
        set: {
          schemaVersion: draftRecord.schemaVersion,
          resumeJson: draftRecord.resumeJson,
          updatedAt: draftRecord.updatedAt,
        },
      });

    return (await this.findDraft())!;
  }

  async findLatestPublishedSnapshot() {
    const [record] = await this.database
      .select()
      .from(resumePublicationSnapshots)
      .where(eq(resumePublicationSnapshots.resumeKey, STANDARD_RESUME_KEY))
      .orderBy(desc(resumePublicationSnapshots.publishedAt))
      .limit(1);

    return record ?? null;
  }

  async createPublishedSnapshot(resume: StandardResume, publishedAt = new Date()) {
    const snapshotRecord = createResumePublicationSnapshotRecord(resume, publishedAt);

    await this.database.insert(resumePublicationSnapshots).values(snapshotRecord);

    return snapshotRecord;
  }
}

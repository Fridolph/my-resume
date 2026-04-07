import { describe, expect, it } from 'vitest';

import { createExampleStandardResume } from '../../modules/resume/domain/standard-resume';

import {
  STANDARD_RESUME_KEY,
  createResumeDraftRecord,
  createResumePublicationSnapshotRecord,
} from '../resume-records';

describe('resume records', () => {
  it('should build a single draft record for the standard resume', () => {
    const resume = createExampleStandardResume();
    const updatedAt = new Date('2026-03-26T12:00:00.000Z');

    const record = createResumeDraftRecord(resume, updatedAt);

    expect(record).toEqual({
      resumeKey: STANDARD_RESUME_KEY,
      schemaVersion: 1,
      resumeJson: resume,
      updatedAt,
    });
  });

  it('should build a publication snapshot record with stable resume key and unique snapshot id', () => {
    const resume = createExampleStandardResume();
    const publishedAt = new Date('2026-03-26T12:30:00.000Z');

    const record = createResumePublicationSnapshotRecord(resume, publishedAt);

    expect(record.resumeKey).toBe(STANDARD_RESUME_KEY);
    expect(record.schemaVersion).toBe(1);
    expect(record.resumeJson).toEqual(resume);
    expect(record.publishedAt).toEqual(publishedAt);
    expect(record.id).toBe('standard-resume:1774528200000');
  });
});

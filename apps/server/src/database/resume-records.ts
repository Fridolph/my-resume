import type { StandardResume } from '../modules/resume/domain/standard-resume';

export const STANDARD_RESUME_KEY = 'standard-resume';

export function createResumeDraftRecord(
  resume: StandardResume,
  updatedAt = new Date(),
) {
  return {
    resumeKey: STANDARD_RESUME_KEY,
    schemaVersion: resume.meta.version,
    resumeJson: resume,
    updatedAt,
  };
}

export function createResumePublicationSnapshotRecord(
  resume: StandardResume,
  publishedAt = new Date(),
) {
  return {
    id: `${STANDARD_RESUME_KEY}:${publishedAt.getTime()}`,
    resumeKey: STANDARD_RESUME_KEY,
    schemaVersion: resume.meta.version,
    resumeJson: resume,
    publishedAt,
  };
}

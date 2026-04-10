import type { StandardResume } from '../../domain/standard-resume'
import type { ResumeSummary } from '../../resume-summary'

export type ResumeSnapshotStatus = 'draft' | 'published'

export type ResumeSnapshotTimestampKey<S extends ResumeSnapshotStatus> =
  S extends 'draft' ? 'updatedAt' : 'publishedAt'

type ResumeSnapshotTimestampField<S extends ResumeSnapshotStatus> = {
  [K in ResumeSnapshotTimestampKey<S>]: string
}

export type ResumeSnapshot<S extends ResumeSnapshotStatus, TResume> = {
  status: S
  resume: TResume
} & ResumeSnapshotTimestampField<S>

export type ResumeDraftSnapshot<TResume = StandardResume> = ResumeSnapshot<'draft', TResume>
export type ResumePublishedSnapshot<TResume = StandardResume> = ResumeSnapshot<
  'published',
  TResume
>

export type ResumeDraftSummarySnapshot = ResumeDraftSnapshot<ResumeSummary>
export type ResumePublishedSummarySnapshot = ResumePublishedSnapshot<ResumeSummary>

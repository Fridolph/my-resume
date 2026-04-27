import type { StandardResume } from '../../domain/standard-resume'
import type { ResumeSummary } from '../../resume-summary'

/**
 * 简历快照状态。
 */
export type ResumeSnapshotStatus = 'draft' | 'published'

/**
 * 不同快照状态对应的时间字段键。
 */
export type ResumeSnapshotTimestampKey<S extends ResumeSnapshotStatus> =
  S extends 'draft' ? 'updatedAt' : 'publishedAt'

/**
 * 快照时间字段映射。
 */
type ResumeSnapshotTimestampField<S extends ResumeSnapshotStatus> = {
  [K in ResumeSnapshotTimestampKey<S>]: string
}

/**
 * 通用快照结构。
 */
export type ResumeSnapshot<S extends ResumeSnapshotStatus, TResume> = {
  status: S
  resume: TResume
} & ResumeSnapshotTimestampField<S>

/**
 * 草稿快照结构。
 */
export type ResumeDraftSnapshot<TResume = StandardResume> = ResumeSnapshot<'draft', TResume>

/**
 * 发布快照结构。
 */
export type ResumePublishedSnapshot<TResume = StandardResume> = ResumeSnapshot<
  'published',
  TResume
>

/**
 * 草稿摘要快照结构。
 */
export type ResumeDraftSummarySnapshot = ResumeDraftSnapshot<ResumeSummary>

/**
 * 发布摘要快照结构。
 */
export type ResumePublishedSummarySnapshot = ResumePublishedSnapshot<ResumeSummary>

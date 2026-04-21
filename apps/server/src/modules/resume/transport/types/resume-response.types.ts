/**
 * transport 层简历响应类型别名。
 *
 * 说明：
 * - 该文件只做应用层类型到 controller 响应语义的命名映射。
 * - 不新增字段，避免 transport 与 application 语义漂移。
 */
export type {
  ResumeDraftSnapshot as ResumeDraftSnapshotResponse,
  ResumeDraftSummarySnapshot as ResumeDraftSummarySnapshotResponse,
  ResumePublishedSnapshot as ResumePublishedSnapshotResponse,
  ResumePublishedSummarySnapshot as ResumePublishedSummarySnapshotResponse,
} from '../../application/types/resume-snapshot.types'

/**
 * 可提取文本的文件类型。
 */
export type ExtractedFileType = 'txt' | 'md' | 'pdf' | 'docx'

/**
 * 文件提取结果模型。
 */
export interface FileExtractionResult {
  fileName: string
  fileType: ExtractedFileType
  mimeType: string
  text: string
  charCount: number
}

/**
 * user_docs 入库作用域。
 */
export type UserDocIngestScope = 'draft' | 'published'

/**
 * user_docs 切片策略。
 *
 * `balanced` 适合默认入库闭环，`contextual` 适合更长上下文检索实验。
 */
export type UserDocChunkingProfile = 'balanced' | 'contextual'

/**
 * user_docs 自定义切片大小下限。
 */
export const USER_DOC_MIN_CHUNK_SIZE = 4

/**
 * user_docs 自定义切片大小上限。
 */
export const USER_DOC_MAX_CHUNK_SIZE = 6666

/**
 * user_docs 自定义重叠长度下限。
 */
export const USER_DOC_MIN_CHUNK_OVERLAP = 0

/**
 * user_docs 自定义重叠长度上限。
 */
export const USER_DOC_MAX_CHUNK_OVERLAP = 300

/**
 * user_docs 入库结果。
 */
export interface UserDocIngestResult {
  /** 检索态文档 ID，用于追溯整份上传资料。 */
  documentId: string
  /** 来源 ID，同一次上传生成的 chunks 会共享该值。 */
  sourceId: string
  /** 写入的资料作用域。 */
  sourceScope: UserDocIngestScope
  /** 上传版本键，用于区分同一资料的多次入库结果。 */
  sourceVersion: string
  /** 本次入库生成的 chunk 数量。 */
  chunkCount: number
  /** 上传文件名。 */
  fileName: string
  /** 解析后的文件类型。 */
  fileType: ExtractedFileType
  /** 实际使用的切片策略。 */
  chunkingProfile: UserDocChunkingProfile
  /** 实际切片大小，单位为字符。 */
  chunkSize: number
  /** 相邻 chunk 的重叠字符数。 */
  chunkOverlap: number
  /** 文件上传并入库完成的时间。 */
  uploadedAt: string
}

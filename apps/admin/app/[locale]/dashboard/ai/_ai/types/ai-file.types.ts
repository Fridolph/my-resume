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
 * user_docs 入库结果。
 */
export interface UserDocIngestResult {
  documentId: string
  sourceId: string
  sourceScope: UserDocIngestScope
  sourceVersion: string
  chunkCount: number
  fileName: string
  fileType: ExtractedFileType
  uploadedAt: string
}

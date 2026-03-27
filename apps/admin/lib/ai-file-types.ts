export type ExtractedFileType = 'txt' | 'md' | 'pdf' | 'docx';

export interface FileExtractionResult {
  fileName: string;
  fileType: ExtractedFileType;
  mimeType: string;
  text: string;
  charCount: number;
}

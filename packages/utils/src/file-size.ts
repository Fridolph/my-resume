/**
 * Format byte size for upload previews and lightweight status summaries.
 */
/**
 * 将上传文件字节数格式化为轻量 UI 文案。
 *
 * 当前后台上传面板只需要 B/KB 级展示；如果后续支持更大文件，再扩展 MB/GB。
 */
export function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`
  }

  return `${(size / 1024).toFixed(1)} KB`
}

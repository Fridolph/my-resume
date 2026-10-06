/**
 * 识别用户取消 / AbortController，用于上传进度等场景不把取消当失败。
 */
export function isAbortError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') {
    return true
  }
  const message = err instanceof Error ? err.message : String(err ?? '')
  return /abort/i.test(message)
}

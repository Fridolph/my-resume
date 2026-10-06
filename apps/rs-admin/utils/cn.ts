export type ClassInput = string | null | undefined | false

/**
 * 极简 class 合并：过滤空值后拼接。
 * 用于「组件默认类 + 调用方传入覆盖」的合并场景。
 */
export function cn(...inputs: ClassInput[]): string {
  return inputs.filter(Boolean).join(' ')
}

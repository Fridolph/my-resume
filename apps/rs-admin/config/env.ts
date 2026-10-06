/**
 * 环境变量集中读取。
 * 避免 process.env 散落在组件/请求层（旧 admin 的教训）。
 */
export const env = {
  /** 后端 API 基地址 */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5577',
} as const

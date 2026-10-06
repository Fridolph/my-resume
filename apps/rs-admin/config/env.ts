/**
 * 环境变量集中读取。
 * 避免 process.env 散落在组件/请求层（旧 admin 的教训）。
 */
export const env = {
  /** 后端 API 基地址 */
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5577',
  /**
   * 是否使用本地 mock 数据（不发请求）。
   * 默认开启；等接入后端时在 .env.local 设 NEXT_PUBLIC_USE_MOCK=false 即可切回真实接口。
   */
  useMock: process.env.NEXT_PUBLIC_USE_MOCK !== 'false',
} as const

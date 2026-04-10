import type { FetchRequestInit } from 'alova/fetch'

/**
 * HTTP 请求方法
 */
export type HttpMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'HEAD'
  | 'OPTIONS'
  | (string & {})

/**
 * GET 重试策略
 */
export interface RetryPolicy {
  maxRetries: number
  baseDelayMs: number
  maxDelayMs: number
  retryableStatusCodes: number[]
}

/**
 * 单次请求策略
 */
export interface RequestPolicy {
  timeoutMs?: number
  retry?: false | Partial<RetryPolicy>
}

/**
 * 适配器请求配置
 */
export interface HttpAdapterRequestConfig {
  body?: BodyInit | null
  headers?: Record<string, string>
  method: HttpMethod
  requestInit?: Omit<FetchRequestInit, 'body' | 'headers' | 'method' | 'signal'>
  signal?: AbortSignal
  timeoutMs: number
  url: string
}

/**
 * 适配器响应结构
 */
export interface HttpAdapterResponse {
  headers: Headers
  json: () => Promise<unknown>
  ok: boolean
  raw: unknown
  status: number
  text: () => Promise<string>
}

/**
 * HTTP 适配器抽象
 */
export interface HttpAdapter {
  request: (config: HttpAdapterRequestConfig) => Promise<HttpAdapterResponse>
}

/**
 * Axios 风格响应结构
 */
export interface AxiosLikeResponse {
  data: unknown
  headers?: Record<string, unknown>
  status: number
}

/**
 * Axios 风格实例抽象
 */
export interface AxiosLikeInstance {
  request: (config: {
    data?: BodyInit | null
    headers?: Record<string, string>
    method: string
    signal?: AbortSignal
    url: string
    validateStatus?: (status: number) => boolean
  }) => Promise<AxiosLikeResponse>
}

/**
 * API client 请求输入
 */
export interface ApiRequestInput {
  accessToken?: string
  apiBaseUrl: string
  body?: BodyInit | null
  fallbackErrorMessage: string
  headers?: Record<string, string>
  method?: HttpMethod
  pathname: string
  query?: Record<string, string | number | boolean | null | undefined>
  requestInit?: Omit<FetchRequestInit, 'body' | 'headers' | 'method' | 'signal'>
  requestPolicy?: RequestPolicy
  responseType?: 'json' | 'text' | 'raw'
  returnNullOnNotFound?: boolean
}

/**
 * API client 初始化参数
 */
export interface ApiClientOptions {
  adapter?: HttpAdapter
  getRetryPolicy?: Partial<RetryPolicy>
  readTimeoutMs?: number
  writeTimeoutMs?: number
}


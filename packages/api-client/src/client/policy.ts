import { ApiClientTimeoutError } from './errors'
import type { HttpMethod, RequestPolicy, RetryPolicy } from '../types/client.types'

const DEFAULT_READ_TIMEOUT_MS = 10_000
const DEFAULT_WRITE_TIMEOUT_MS = 15_000

/**
 * 默认 GET 重试策略
 */
export const DEFAULT_GET_RETRY_POLICY: RetryPolicy = {
  maxRetries: 2,
  baseDelayMs: 300,
  maxDelayMs: 2_000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
}

/**
 * 默认读请求超时
 */
export const DEFAULT_READ_TIMEOUT = DEFAULT_READ_TIMEOUT_MS

/**
 * 默认写请求超时
 */
export const DEFAULT_WRITE_TIMEOUT = DEFAULT_WRITE_TIMEOUT_MS

/**
 * 计算重试退避延迟
 *
 * @param retryPolicy 重试策略
 * @param retryIndex 当前重试序号
 * @returns 本次重试延迟
 */
export function computeRetryDelay(retryPolicy: RetryPolicy, retryIndex: number): number {
  const nextDelay = retryPolicy.baseDelayMs * 2 ** retryIndex
  return Math.min(nextDelay, retryPolicy.maxDelayMs)
}

/**
 * 等待指定时间
 *
 * @param durationMs 等待时长
 * @returns Promise<void>
 */
export function sleep(durationMs: number): Promise<void> {
  if (durationMs <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

/**
 * 判断错误是否可按传输层重试
 *
 * @param error 捕获到的错误
 * @returns 是否可重试
 */
export function isRetryableTransportError(error: unknown): boolean {
  if (error instanceof ApiClientTimeoutError) {
    return true
  }

  if (error instanceof TypeError) {
    return true
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as { isAxiosError: boolean }).isAxiosError === true
  ) {
    return true
  }

  return false
}

/**
 * 解析请求重试策略
 *
 * @param method 请求方法
 * @param requestPolicy 单次请求策略
 * @param fallbackRetryPolicy 默认重试策略
 * @returns 最终重试策略或 null
 */
export function resolveRetryPolicy(
  method: HttpMethod,
  requestPolicy: RequestPolicy | undefined,
  fallbackRetryPolicy: RetryPolicy,
): RetryPolicy | null {
  if (method !== 'GET') {
    return null
  }

  if (requestPolicy?.retry === false) {
    return null
  }

  return {
    ...fallbackRetryPolicy,
    ...(requestPolicy?.retry ?? {}),
  }
}

/**
 * 解析请求超时
 *
 * @param method 请求方法
 * @param requestPolicy 单次请求策略
 * @param readTimeoutMs 默认读超时
 * @param writeTimeoutMs 默认写超时
 * @returns 最终超时毫秒值
 */
export function resolveTimeoutMs(
  method: HttpMethod,
  requestPolicy: RequestPolicy | undefined,
  readTimeoutMs: number,
  writeTimeoutMs: number,
): number {
  if (requestPolicy?.timeoutMs !== undefined) {
    return requestPolicy.timeoutMs
  }

  return method === 'GET' || method === 'HEAD' ? readTimeoutMs : writeTimeoutMs
}


import type { HttpAdapterResponse } from '../types/client.types'

/**
 * 请求超时错误
 */
export class ApiClientTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`请求超时，请稍后重试（${timeoutMs}ms）`)
    this.name = 'ApiClientTimeoutError'
  }
}

/**
 * HTTP 状态错误
 */
export class ApiClientHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: HttpAdapterResponse,
  ) {
    super(`HTTP ${status}`)
    this.name = 'ApiClientHttpError'
  }
}

/**
 * 解析接口错误信息
 *
 * @param response 接口响应
 * @param fallbackMessage 兜底错误文案
 * @returns 可展示给用户的错误信息
 */
export async function resolveApiErrorMessage(
  response: HttpAdapterResponse,
  fallbackMessage: string,
): Promise<string> {
  try {
    const payload = (await response.json()) as {
      error?: unknown
      message?: unknown
    }

    if (typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message
    }

    if (Array.isArray(payload.message)) {
      const messages = payload.message.filter(
        (item): item is string => typeof item === 'string' && item.trim().length > 0,
      )

      if (messages.length > 0) {
        return messages.join('；')
      }
    }

    if (typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error
    }
  } catch {
    return fallbackMessage
  }

  return fallbackMessage
}


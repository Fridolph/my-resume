import type {
  AxiosLikeInstance,
  AxiosLikeResponse,
  HttpAdapter,
  HttpAdapterResponse,
} from '../types/client.types'
import { ApiClientTimeoutError } from './errors'

const EMPTY_HEADERS = new Headers()

function normalizeHeaders(headers: Record<string, unknown> | undefined): Headers {
  if (!headers) {
    return EMPTY_HEADERS
  }

  const normalized = new Headers()

  for (const [headerKey, headerValue] of Object.entries(headers)) {
    if (headerValue === undefined || headerValue === null) {
      continue
    }

    normalized.set(headerKey, String(headerValue))
  }

  return normalized
}

function createResponseFromFetch(response: Response): HttpAdapterResponse {
  return {
    status: response.status,
    ok: response.ok,
    headers: response.headers,
    json: () => response.json(),
    text: () => response.text(),
    raw: response,
  }
}

function createResponseFromAxios(response: AxiosLikeResponse): HttpAdapterResponse {
  const responseHeaders = normalizeHeaders(response.headers as Record<string, unknown>)
  const responseData = response.data

  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    headers: responseHeaders,
    json: async () => {
      if (typeof responseData === 'string') {
        return JSON.parse(responseData) as unknown
      }

      return responseData
    },
    text: async () => {
      if (typeof responseData === 'string') {
        return responseData
      }

      return JSON.stringify(responseData)
    },
    raw: response,
  }
}

/**
 * 创建基于 Fetch 的 HTTP 适配器
 *
 * @param options 适配器选项
 * @returns 可注入到 createApiClient 的 HttpAdapter
 */
export function createFetchAdapter(options?: {
  customFetch?: typeof fetch
}): HttpAdapter {
  return {
    async request(config) {
      const requestWithFetch = options?.customFetch ?? globalThis.fetch
      const abortController = new AbortController()
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null
      let timedOut = false
      const externalSignal = config.signal

      const handleExternalAbort = () => {
        abortController.abort(externalSignal?.reason)
      }

      if (externalSignal) {
        if (externalSignal.aborted) {
          abortController.abort(externalSignal.reason)
        } else {
          externalSignal.addEventListener('abort', handleExternalAbort, { once: true })
        }
      }

      // 统一超时通过 AbortController 中断请求
      if (config.timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          timedOut = true
          abortController.abort()
        }, config.timeoutMs)
      }

      try {
        const response = await requestWithFetch(config.url, {
          ...config.requestInit,
          method: config.method,
          headers: config.headers,
          body: config.body,
          signal: abortController.signal,
        })

        return createResponseFromFetch(response)
      } catch (error) {
        if (timedOut) {
          throw new ApiClientTimeoutError(config.timeoutMs)
        }

        throw error
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
        }

        if (externalSignal) {
          externalSignal.removeEventListener('abort', handleExternalAbort)
        }
      }
    },
  }
}

/**
 * 创建 Axios 风格 HTTP 适配器
 *
 * @param options 适配器选项
 * @returns 可注入到 createApiClient 的 HttpAdapter
 */
export function createAxiosAdapter(options?: {
  instance?: AxiosLikeInstance
}): HttpAdapter {
  const axiosInstance = options?.instance

  if (!axiosInstance) {
    throw new Error(
      'createAxiosAdapter 需要传入 axios 实例。请在业务侧安装 axios 并通过 options.instance 注入',
    )
  }

  return {
    async request(config) {
      const abortController = new AbortController()
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null
      let timedOut = false
      const externalSignal = config.signal

      const handleExternalAbort = () => {
        abortController.abort(externalSignal?.reason)
      }

      if (externalSignal) {
        if (externalSignal.aborted) {
          abortController.abort(externalSignal.reason)
        } else {
          externalSignal.addEventListener('abort', handleExternalAbort, { once: true })
        }
      }

      // 统一超时通过 AbortController 中断请求
      if (config.timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          timedOut = true
          abortController.abort()
        }, config.timeoutMs)
      }

      try {
        const response = await axiosInstance.request({
          url: config.url,
          method: config.method,
          data: config.body,
          headers: config.headers,
          signal: abortController.signal,
          validateStatus: () => true,
        })

        return createResponseFromAxios(response)
      } catch (error) {
        if (timedOut) {
          throw new ApiClientTimeoutError(config.timeoutMs)
        }

        throw error
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle)
        }

        if (externalSignal) {
          externalSignal.removeEventListener('abort', handleExternalAbort)
        }
      }
    },
  }
}


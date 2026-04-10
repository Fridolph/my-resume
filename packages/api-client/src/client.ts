import { createAlova, type AlovaRequestAdapter, type MethodType } from 'alova'
import fetchRequestAdapter, { type FetchRequestInit } from 'alova/fetch'
import type {
  ApiClientOptions,
  ApiRequestInput,
  AxiosLikeInstance,
  AxiosLikeResponse,
  HttpAdapter,
  HttpAdapterResponse,
  HttpMethod,
  RequestPolicy,
  RetryPolicy,
} from './types/client.types'

export type {
  ApiClientOptions,
  ApiRequestInput,
  AxiosLikeInstance,
  AxiosLikeResponse,
  HttpAdapter,
  HttpAdapterRequestConfig,
  HttpAdapterResponse,
  HttpMethod,
  RequestPolicy,
  RetryPolicy,
} from './types/client.types'

interface AlovaMethodRequestConfig {
  requestInit?: Omit<FetchRequestInit, 'body' | 'headers' | 'method' | 'signal'>
}

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

const EMPTY_HEADERS = new Headers()
const EMPTY_BODY = ''

class ApiClientTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`请求超时，请稍后重试（${timeoutMs}ms）`)
    this.name = 'ApiClientTimeoutError'
  }
}

class ApiClientHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly response: HttpAdapterResponse,
  ) {
    super(`HTTP ${status}`)
    this.name = 'ApiClientHttpError'
  }
}

function isBodyAllowed(method: HttpMethod): boolean {
  const normalizedMethod = method.toUpperCase()
  return normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD'
}

function normalizeMethod(method: HttpMethod | undefined): HttpMethod {
  return (method ?? 'GET').toUpperCase()
}

function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  return `${apiBaseUrl.replace(/\/$/, '')}${pathname}`
}

function buildUrlWithQuery(
  apiBaseUrl: string,
  pathname: string,
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  const baseUrl = joinApiUrl(apiBaseUrl, pathname)

  if (!query) {
    return baseUrl
  }

  const searchParams = new URLSearchParams()

  for (const [queryKey, queryValue] of Object.entries(query)) {
    if (queryValue === undefined || queryValue === null) {
      continue
    }

    searchParams.set(queryKey, String(queryValue))
  }

  const queryString = searchParams.toString()

  if (!queryString) {
    return baseUrl
  }

  return `${baseUrl}?${queryString}`
}

function sleep(durationMs: number): Promise<void> {
  if (durationMs <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    setTimeout(resolve, durationMs)
  })
}

function computeRetryDelay(retryPolicy: RetryPolicy, retryIndex: number): number {
  const nextDelay = retryPolicy.baseDelayMs * 2 ** retryIndex
  return Math.min(nextDelay, retryPolicy.maxDelayMs)
}

function isRetryableTransportError(error: unknown): boolean {
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

function resolveRetryPolicy(
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

function resolveTimeoutMs(
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

function createAlovaAdapter(
  adapter: HttpAdapter,
): AlovaRequestAdapter<AlovaMethodRequestConfig, HttpAdapterResponse, Headers> {
  return (elements, method) => {
    const methodConfig = method.config as {
      requestInit?: Omit<FetchRequestInit, 'body' | 'headers' | 'method' | 'signal'>
      timeout?: number
    }
    const requestAbortController = new AbortController()
    let responsePromise: Promise<HttpAdapterResponse> | null = null

    const sendRequest = () => {
      if (!responsePromise) {
        responsePromise = adapter.request({
          url: elements.url,
          method: String(elements.type).toUpperCase(),
          headers: Object.fromEntries(Object.entries(elements.headers ?? {})),
          body: (elements.data ?? null) as BodyInit | null,
          timeoutMs: methodConfig.timeout ?? DEFAULT_READ_TIMEOUT_MS,
          signal: requestAbortController.signal,
          requestInit: methodConfig.requestInit,
        })
      }

      return responsePromise
    }

    return {
      response: sendRequest,
      headers: async () => (await sendRequest()).headers,
      abort: () => requestAbortController.abort(),
    }
  }
}

async function resolveApiErrorMessage(
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

async function parseResponsePayload<T>(
  response: HttpAdapterResponse,
  responseType: ApiRequestInput['responseType'],
): Promise<T> {
  if (responseType === 'raw') {
    return response.raw as T
  }

  if (responseType === 'text') {
    return (await response.text()) as T
  }

  if (response.status === 204) {
    return null as T
  }

  return (await response.json()) as T
}

/**
 * 创建 API 请求客户端
 *
 * @param options 客户端初始化参数
 * @returns 统一请求入口
 */
export function createApiClient(options?: ApiClientOptions) {
  const readTimeoutMs = options?.readTimeoutMs ?? DEFAULT_READ_TIMEOUT_MS
  const writeTimeoutMs = options?.writeTimeoutMs ?? DEFAULT_WRITE_TIMEOUT_MS
  const getRetryPolicy = {
    ...DEFAULT_GET_RETRY_POLICY,
    ...(options?.getRetryPolicy ?? {}),
  }
  const adapter = options?.adapter ?? createFetchAdapter()

  const alovaInstance = createAlova({
    requestAdapter: createAlovaAdapter(adapter),
    cacheFor: null,
    responded: {
      onSuccess: (response) => response,
    },
  })

  const requestWithAlova = async (
    method: HttpMethod,
    url: string,
    input: ApiRequestInput,
    timeoutMs: number,
    headers: Record<string, string>,
  ) => {
    const methodConfig = {
      headers,
      timeout: timeoutMs,
      requestInit: input.requestInit,
    }

    if (method === 'GET') {
      return (await alovaInstance.Get(url, methodConfig)) as HttpAdapterResponse
    }

    if (method === 'POST') {
      return (await alovaInstance.Post(url, input.body ?? EMPTY_BODY, methodConfig)) as HttpAdapterResponse
    }

    if (method === 'PUT') {
      return (await alovaInstance.Put(url, input.body ?? EMPTY_BODY, methodConfig)) as HttpAdapterResponse
    }

    if (method === 'PATCH') {
      return (await alovaInstance.Patch(url, input.body ?? EMPTY_BODY, methodConfig)) as HttpAdapterResponse
    }

    if (method === 'DELETE') {
      return (await alovaInstance.Delete(url, input.body ?? EMPTY_BODY, methodConfig)) as HttpAdapterResponse
    }

    if (method === 'HEAD') {
      return (await alovaInstance.Head(url, methodConfig)) as HttpAdapterResponse
    }

    if (method === 'OPTIONS') {
      return (await alovaInstance.Options(url, methodConfig)) as HttpAdapterResponse
    }

    return (await alovaInstance.Request({
      url,
      method: method as MethodType,
      headers,
      data: input.body ?? undefined,
      timeout: timeoutMs,
      requestInit: input.requestInit,
    })) as HttpAdapterResponse
  }

  return {
    async request<T>(input: ApiRequestInput): Promise<T> {
      const normalizedMethod = normalizeMethod(input.method)
      const timeoutMs = resolveTimeoutMs(
        normalizedMethod,
        input.requestPolicy,
        readTimeoutMs,
        writeTimeoutMs,
      )
      const retryPolicy = resolveRetryPolicy(
        normalizedMethod,
        input.requestPolicy,
        getRetryPolicy,
      )
      const requestUrl = buildUrlWithQuery(input.apiBaseUrl, input.pathname, input.query)
      const requestHeaders: Record<string, string> = {
        ...(input.headers ?? {}),
      }

      if (input.accessToken && !requestHeaders.Authorization) {
        requestHeaders.Authorization = `Bearer ${input.accessToken}`
      }

      let retryIndex = 0

      while (true) {
        try {
          const response = await requestWithAlova(
            normalizedMethod,
            requestUrl,
            input,
            timeoutMs,
            requestHeaders,
          )

          if (response.status === 404 && input.returnNullOnNotFound) {
            return null as T
          }

          if (!response.ok) {
            const httpError = new ApiClientHttpError(response.status, response)

            if (
              retryPolicy &&
              retryIndex < retryPolicy.maxRetries &&
              retryPolicy.retryableStatusCodes.includes(httpError.status)
            ) {
              const retryDelay = computeRetryDelay(retryPolicy, retryIndex)
              retryIndex += 1
              await sleep(retryDelay)
              continue
            }

            throw new Error(
              await resolveApiErrorMessage(response, input.fallbackErrorMessage),
            )
          }

          return parseResponsePayload<T>(response, input.responseType)
        } catch (error) {
          if (
            retryPolicy &&
            retryIndex < retryPolicy.maxRetries &&
            isRetryableTransportError(error)
          ) {
            const retryDelay = computeRetryDelay(retryPolicy, retryIndex)
            retryIndex += 1
            await sleep(retryDelay)
            continue
          }

          if (error instanceof Error) {
            throw error
          }

          throw new Error(input.fallbackErrorMessage)
        }
      }
    },
  }
}

/**
 * 默认 API client
 */
export const defaultApiClient = createApiClient({
  adapter: createFetchAdapter(),
})

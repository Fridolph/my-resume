import type {
  ApiClientOptions,
  ApiRequestInput,
  HttpAdapterResponse,
  HttpMethod,
} from './types/client.types'
import {
  computeRetryDelay,
  DEFAULT_GET_RETRY_POLICY,
  DEFAULT_READ_TIMEOUT,
  DEFAULT_WRITE_TIMEOUT,
  isRetryableTransportError,
  resolveRetryPolicy,
  resolveTimeoutMs,
  sleep,
} from './client/policy'
import { ApiClientHttpError, resolveApiErrorMessage } from './client/errors'
import {
  createAlovaRequestExecutor,
  type ExecuteWithAlovaInput,
} from './client/executor'
import { createAxiosAdapter, createFetchAdapter } from './client/adapters'

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

export { createAxiosAdapter, createFetchAdapter, DEFAULT_GET_RETRY_POLICY }

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
  const readTimeoutMs = options?.readTimeoutMs ?? DEFAULT_READ_TIMEOUT
  const writeTimeoutMs = options?.writeTimeoutMs ?? DEFAULT_WRITE_TIMEOUT
  const getRetryPolicy = {
    ...DEFAULT_GET_RETRY_POLICY,
    ...(options?.getRetryPolicy ?? {} as any),
  }
  const adapter = options?.adapter ?? createFetchAdapter()
  const executeRequestWithAlova = createAlovaRequestExecutor(adapter, readTimeoutMs)

  return {
    /**
     * 统一请求入口
     *
     * @param input 请求参数
     * @returns 接口返回数据
     */
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
        ...(input.headers ?? {} as any),
      }

      if (input.accessToken && !requestHeaders.Authorization) {
        requestHeaders.Authorization = `Bearer ${input.accessToken}`
      }

      let retryIndex = 0

      while (true) {
        try {
          // 统一交给 alova 执行，底层可通过 adapter 切换 fetch/axios
          const executeInput: ExecuteWithAlovaInput = {
            method: normalizedMethod,
            url: requestUrl,
            body: input.body ?? null,
            headers: requestHeaders,
            timeoutMs,
            requestInit: input.requestInit,
          }
          const response = await executeRequestWithAlova(executeInput)

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
          // GET 仅在可恢复错误下自动重试，避免写操作重复提交
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

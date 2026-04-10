import { createAlova } from 'alova'
import type { Method, MethodType } from 'alova'

import type {
  ApiClientMethod,
  ApiClientOptions,
  ApiRequestInput,
  ApiClientRequestAdapter,
  AxiosLikeInstance,
  HttpAdapter,
  HttpAdapterRequestConfig,
  HttpAdapterResponse,
  HttpMethod,
  RequestPolicy,
  RetryPolicy,
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
  createAxiosAdapter,
  createFetchAdapter,
  createLegacyHttpAdapterRequestAdapter,
  isHttpAdapter,
  normalizeAdapterResponse,
} from './client/adapters'

export type {
  ApiClientMethod,
  ApiClientOptions,
  ApiClientRequestAdapter,
  ApiRequestInput,
  AxiosLikeInstance,
  HttpAdapter,
  HttpAdapterRequestConfig,
  HttpAdapterResponse,
  HttpMethod,
  RequestPolicy,
  RetryPolicy,
} from './types/client.types'

export { createAxiosAdapter, createFetchAdapter, DEFAULT_GET_RETRY_POLICY }

interface ApiClientMethodMeta {
  accessToken?: string
}

type AlovaMethodWithMeta = Method<any> & {
  config: {
    headers?: Record<string, string>
  }
  meta?: ApiClientMethodMeta
}

function normalizeMethod(method: HttpMethod | undefined): HttpMethod {
  return (method ?? 'GET').toUpperCase()
}

function isBodyAllowed(method: HttpMethod): boolean {
  const normalizedMethod = method.toUpperCase()
  return normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD'
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

async function resolveMethodPayload<T>(
  response: HttpAdapterResponse,
  input: ApiRequestInput,
): Promise<T> {
  if (response.status === 404 && input.returnNullOnNotFound) {
    return null as T
  }

  if (!response.ok) {
    throw new ApiClientHttpError(response.status, response)
  }

  return parseResponsePayload<T>(response, input.responseType)
}

function resolveRequestAdapter(options?: ApiClientOptions): ApiClientRequestAdapter {
  if (options?.requestAdapter) {
    return options.requestAdapter
  }

  if (options?.adapter && isHttpAdapter(options.adapter)) {
    return createLegacyHttpAdapterRequestAdapter(
      options.adapter,
      options.readTimeoutMs ?? DEFAULT_READ_TIMEOUT,
    )
  }

  return createFetchAdapter()
}

/**
 * 创建 API 请求客户端
 *
 * @param options 客户端初始化参数
 * @returns Method-first 请求客户端
 */
export function createApiClient(options?: ApiClientOptions) {
  const readTimeoutMs = options?.readTimeoutMs ?? DEFAULT_READ_TIMEOUT
  const writeTimeoutMs = options?.writeTimeoutMs ?? DEFAULT_WRITE_TIMEOUT
  const getRetryPolicy = {
    ...DEFAULT_GET_RETRY_POLICY,
    ...(options?.getRetryPolicy ?? {}),
  }
  const requestAdapter = resolveRequestAdapter(options)

  const alovaInstance = createAlova({
    requestAdapter,
    cacheFor: null,
    beforeRequest: (method) => {
      const typedMethod = method as AlovaMethodWithMeta
      const accessToken = typedMethod.meta?.accessToken

      if (!accessToken) {
        return
      }

      const nextHeaders: Record<string, string> = {
        ...(typedMethod.config.headers ?? {}),
      }

      if (!nextHeaders.Authorization) {
        nextHeaders.Authorization = `Bearer ${accessToken}`
      }

      typedMethod.config.headers = nextHeaders
    },
    responded: {
      onSuccess: (response) => normalizeAdapterResponse(response),
    },
  })

  /**
   * 只负责构造 Method 实例
   *
   * @param input 请求参数
   * @returns 可用于 hooks 或直接 await 的 Method
   */
  function createMethod<T>(input: ApiRequestInput): ApiClientMethod<T> {
    const normalizedMethod = normalizeMethod(input.method)
    const timeoutMs = resolveTimeoutMs(
      normalizedMethod,
      input.requestPolicy,
      readTimeoutMs,
      writeTimeoutMs,
    )
    const requestUrl = buildUrlWithQuery(input.apiBaseUrl, input.pathname, input.query)
    const requestHeaders: Record<string, string> = {
      ...(input.headers ?? {}),
    }

    const methodConfig = {
      ...(input.requestInit ?? {}),
      headers: requestHeaders,
      timeout: timeoutMs,
      transform: async (response: unknown) =>
        resolveMethodPayload<T>(normalizeAdapterResponse(response), input),
      meta: {
        accessToken: input.accessToken,
      } satisfies ApiClientMethodMeta,
    }

    const body = isBodyAllowed(normalizedMethod) ? (input.body ?? undefined) : undefined
    const methodFactoryMap: Partial<Record<HttpMethod, () => ApiClientMethod<T>>> = {
      GET: () => alovaInstance.Get<T, HttpAdapterResponse>(requestUrl, methodConfig),
      POST: () => alovaInstance.Post<T, HttpAdapterResponse>(requestUrl, body, methodConfig),
      PUT: () => alovaInstance.Put<T, HttpAdapterResponse>(requestUrl, body, methodConfig),
      DELETE: () => alovaInstance.Delete<T, HttpAdapterResponse>(requestUrl, body, methodConfig),
      PATCH: () => alovaInstance.Patch<T, HttpAdapterResponse>(requestUrl, body, methodConfig),
      HEAD: () => alovaInstance.Head<T, HttpAdapterResponse>(requestUrl, methodConfig),
      OPTIONS: () => alovaInstance.Options<T, HttpAdapterResponse>(requestUrl, methodConfig),
    }

    const factory = methodFactoryMap[normalizedMethod]
    if (factory) {
      return factory()
    }

    return alovaInstance.Request<T, HttpAdapterResponse>({
      url: requestUrl,
      method: normalizedMethod as MethodType,
      data: body,
      ...methodConfig,
    })
  }

  /**
   * 只负责发送 Method，并应用重试/错误归一策略
   *
   * @param method 待发送 Method
   * @param options 发送策略
   * @returns 接口返回数据
   */
  async function send<T>(
    method: ApiClientMethod<T>,
    options: {
      fallbackErrorMessage: string
      method?: HttpMethod
      requestPolicy?: RequestPolicy
    },
  ): Promise<T> {
    const normalizedMethod = normalizeMethod(options.method)
    const retryPolicy = resolveRetryPolicy(
      normalizedMethod,
      options.requestPolicy,
      getRetryPolicy,
    )
    let retryIndex = 0

    while (true) {
      try {
        return await method.send()
      } catch (error) {
        if (
          error instanceof ApiClientHttpError &&
          retryPolicy &&
          retryIndex < retryPolicy.maxRetries &&
          retryPolicy.retryableStatusCodes.includes(error.status)
        ) {
          const retryDelay = computeRetryDelay(retryPolicy, retryIndex)
          retryIndex += 1
          await sleep(retryDelay)
          continue
        }

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

        if (error instanceof ApiClientHttpError) {
          throw new Error(
            await resolveApiErrorMessage(error.response, options.fallbackErrorMessage),
          )
        }

        if (error instanceof Error) {
          throw error
        }

        throw new Error(options.fallbackErrorMessage)
      }
    }
  }

  return {
    createMethod,
    send,
    /**
     * Promise 兼容入口
     *
     * @param input 请求参数
     * @returns 接口返回数据
     */
    request<T>(input: ApiRequestInput): Promise<T> {
      const method = createMethod<T>(input)
      return send(method, {
        method: input.method,
        requestPolicy: input.requestPolicy,
        fallbackErrorMessage: input.fallbackErrorMessage,
      })
    },
  }
}

/**
 * 默认 API client
 */
export const defaultApiClient = createApiClient({
  requestAdapter: createFetchAdapter(),
})

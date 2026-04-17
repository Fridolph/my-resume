import { createAlova } from 'alova'
import type { Method, MethodType } from 'alova'
import adapterFetch from 'alova/fetch'
import reactHook from 'alova/react'

import type {
  ApiClientMethod,
  ApiRequestInput,
  ApiResponseType,
  HttpMethod,
} from './types/client.types'

export type {
  ApiClientMethod,
  ApiRequestInput,
  ApiResponseType,
  HttpMethod,
} from './types/client.types'

interface ApiClientMethodMeta {
  accessToken?: string
  fallbackErrorMessage: string
  responseType: ApiResponseType
  returnNullOnNotFound?: boolean
}

type AlovaMethodWithMeta = Method<any> & {
  config: {
    headers?: Record<string, string>
    meta?: ApiClientMethodMeta
  }
  meta?: ApiClientMethodMeta
}

interface ApiResponseEnvelopeLike<T = unknown> {
  code: number
  data: T
  message: string
  timestamp: string
  traceId: string
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isApiResponseEnvelopeLike(value: unknown): value is ApiResponseEnvelopeLike {
  if (!isObjectRecord(value)) {
    return false
  }

  return (
    typeof value.code === 'number' &&
    typeof value.message === 'string' &&
    'data' in value &&
    typeof value.timestamp === 'string' &&
    typeof value.traceId === 'string'
  )
}

function normalizeMethod(method: HttpMethod | undefined): HttpMethod {
  return (method ?? 'GET').toUpperCase()
}

function isBodyAllowed(method: HttpMethod): boolean {
  const normalizedMethod = method.toUpperCase()
  return normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD'
}

function normalizeApiPath(pathname: string): string {
  const normalizedPathname = pathname.startsWith('/') ? pathname : `/${pathname}`

  if (normalizedPathname === '/api' || normalizedPathname.startsWith('/api/')) {
    return normalizedPathname
  }

  return `/api${normalizedPathname}`
}

export function joinApiUrl(apiBaseUrl: string, pathname: string): string {
  const normalizedBaseUrl = apiBaseUrl.replace(/\/$/, '').replace(/\/api$/, '')

  return `${normalizedBaseUrl}${normalizeApiPath(pathname)}`
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

function getMethodMeta(method: Method<any>): ApiClientMethodMeta {
  const typedMethod = method as AlovaMethodWithMeta
  return (typedMethod.meta ?? typedMethod.config.meta) as ApiClientMethodMeta
}

async function parseResponsePayload(
  response: Response,
  responseType: ApiResponseType,
): Promise<unknown> {
  if (response.status === 204) {
    return null
  }

  if (responseType === 'raw') {
    return response
  }

  if (responseType === 'text') {
    return response.text()
  }

  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const payload = (await response.json()) as unknown
    // 兼容 server 统一响应契约，默认对 json 自动解包到 data
    if (isApiResponseEnvelopeLike(payload)) {
      return payload.data
    }

    return payload
  }

  const textPayload = await response.text()

  if (!textPayload) {
    return null
  }

  try {
    return JSON.parse(textPayload) as unknown
  } catch {
    return textPayload
  }
}

async function resolveErrorMessage(
  response: Response,
  fallbackErrorMessage: string,
): Promise<string> {
  try {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const payload = (await response.json()) as {
        code?: number
        data?: unknown
        error?: string
        message?: string | string[]
        traceId?: string
      }

      if (typeof payload.error === 'string' && payload.error.trim()) {
        return payload.error
      }

      if (Array.isArray(payload.message)) {
        const normalizedMessage = payload.message
          .map((messageItem) => messageItem.trim())
          .filter(Boolean)
          .join('；')

        if (normalizedMessage) {
          return normalizedMessage
        }
      }

      if (typeof payload.message === 'string' && payload.message.trim()) {
        if (typeof payload.traceId === 'string' && payload.traceId.trim()) {
          return `${payload.message} (traceId: ${payload.traceId})`
        }

        return payload.message
      }
    }

    const textPayload = await response.text()

    if (textPayload.trim()) {
      return textPayload
    }
  } catch {}

  return fallbackErrorMessage
}

async function resolveSuccessPayload(response: Response, method: Method<any>) {
  const methodMeta = getMethodMeta(method)

  if (response.status === 404 && methodMeta.returnNullOnNotFound) {
    return null
  }

  if (!response.ok) {
    throw new Error(
      await resolveErrorMessage(response.clone(), methodMeta.fallbackErrorMessage),
    )
  }

  return parseResponsePayload(response, methodMeta.responseType)
}

function resolveRequestError(error: unknown, method: Method<any>): Error {
  if (error instanceof Error) {
    return error
  }

  return new Error(getMethodMeta(method).fallbackErrorMessage)
}

const alovaInstance = createAlova({
  cacheFor: null,
  requestAdapter: adapterFetch(),
  statesHook: reactHook,
  beforeRequest: (method) => {
    const typedMethod = method as AlovaMethodWithMeta
    const accessToken = getMethodMeta(typedMethod).accessToken

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
    onError: (error, method) => {
      throw resolveRequestError(error, method)
    },
    onSuccess: resolveSuccessPayload,
  },
})

function createMethod<T>(input: ApiRequestInput<T>): ApiClientMethod<T> {
  const normalizedMethod = normalizeMethod(input.method)
  const requestUrl = buildUrlWithQuery(input.apiBaseUrl, input.pathname, input.query)
  const requestHeaders: Record<string, string> = {
    ...(input.headers ?? {}),
  }

  const methodConfig = {
    ...(input.requestInit ?? {}),
    headers: requestHeaders,
    transform: input.transform ?? ((payload: unknown) => payload as T),
    meta: {
      accessToken: input.accessToken,
      fallbackErrorMessage: input.fallbackErrorMessage,
      responseType: input.responseType ?? 'json',
      returnNullOnNotFound: input.returnNullOnNotFound,
    } satisfies ApiClientMethodMeta,
  }

  const body = isBodyAllowed(normalizedMethod) ? (input.body ?? undefined) : undefined
  const methodFactoryMap: Partial<Record<HttpMethod, () => ApiClientMethod<T>>> = {
    DELETE: () => alovaInstance.Delete<T, unknown>(requestUrl, body, methodConfig),
    GET: () => alovaInstance.Get<T, unknown>(requestUrl, methodConfig),
    HEAD: () => alovaInstance.Head<T, unknown>(requestUrl, methodConfig),
    OPTIONS: () => alovaInstance.Options<T, unknown>(requestUrl, methodConfig),
    PATCH: () => alovaInstance.Patch<T, unknown>(requestUrl, body, methodConfig),
    POST: () => alovaInstance.Post<T, unknown>(requestUrl, body, methodConfig),
    PUT: () => alovaInstance.Put<T, unknown>(requestUrl, body, methodConfig),
  }

  const factory = methodFactoryMap[normalizedMethod]
  if (factory) {
    return factory()
  }

  return alovaInstance.Request<T, unknown>({
    url: requestUrl,
    method: normalizedMethod as MethodType,
    data: body,
    ...methodConfig,
  })
}

/**
 * 默认 API 客户端：只负责创建 Method，供 SSR await 与 CSR hooks 共用
 */
export const defaultApiClient = {
  alova: alovaInstance,
  createMethod,
}

import type { AlovaRequestAdapter } from 'alova'
import adapterFetch, { type AdapterCreateOptions } from 'alova/fetch'
import { createRequire } from 'node:module'

import type {
  ApiClientRequestAdapter,
  AxiosLikeInstance,
  HttpAdapter,
  HttpAdapterResponse,
} from '../types/client.types'

const EMPTY_HEADERS = new Headers()

interface ApiMethodConfigLike {
  [key: string]: unknown
  timeout?: number
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

function isFetchResponse(response: unknown): response is Response {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    'ok' in response &&
    'headers' in response &&
    'json' in response &&
    'text' in response
  )
}

function isAxiosResponseLike(
  response: unknown,
): response is {
  data: unknown
  headers?: Record<string, unknown>
  status: number
} {
  return (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    'data' in response
  )
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

function createResponseFromAxios(response: {
  data: unknown
  headers?: Record<string, unknown>
  status: number
}): HttpAdapterResponse {
  const responseHeaders = normalizeHeaders(response.headers)
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
 * 统一把不同 adapter 的原始响应转换为 api-client 可消费的响应结构
 *
 * @param response adapter 返回的响应
 * @returns 统一响应对象
 */
export function normalizeAdapterResponse(response: unknown): HttpAdapterResponse {
  if (isFetchResponse(response)) {
    return createResponseFromFetch(response)
  }

  if (isAxiosResponseLike(response)) {
    return createResponseFromAxios(response)
  }

  if (
    typeof response === 'object' &&
    response !== null &&
    'status' in response &&
    'ok' in response &&
    'headers' in response &&
    'json' in response &&
    'text' in response &&
    'raw' in response
  ) {
    return response as HttpAdapterResponse
  }

  throw new Error('无法识别请求响应结构，请检查 requestAdapter 配置')
}

/**
 * 创建官方 Fetch requestAdapter
 *
 * @param options 适配器选项
 * @returns alova requestAdapter
 */
export function createFetchAdapter(options?: AdapterCreateOptions): ApiClientRequestAdapter {
  return adapterFetch(options) as ApiClientRequestAdapter
}

/**
 * 创建官方 Axios requestAdapter
 *
 * @param options 适配器选项
 * @returns alova requestAdapter
 */
export function createAxiosAdapter(options?: {
  instance?: AxiosLikeInstance
}): ApiClientRequestAdapter {
  const axiosInstance = options?.instance

  if (!axiosInstance) {
    throw new Error(
      'createAxiosAdapter 需要传入 axios 实例。请在业务侧安装 axios 并通过 options.instance 注入',
    )
  }

  const require = createRequire(import.meta.url)

  let adapterAxiosFactory: undefined | ((options: { axios: AxiosLikeInstance }) => unknown)
  try {
    const adapterAxiosModule = require('@alova/adapter-axios') as {
      default?: (options: { axios: AxiosLikeInstance }) => unknown
    }
    adapterAxiosFactory = adapterAxiosModule.default
  } catch {
    throw new Error(
      '未找到 @alova/adapter-axios。请在工作区安装该依赖后再使用 createAxiosAdapter',
    )
  }

  if (typeof adapterAxiosFactory !== 'function') {
    throw new Error('@alova/adapter-axios 导出异常，无法创建 axios requestAdapter')
  }

  return adapterAxiosFactory({
    axios: axiosInstance,
  }) as ApiClientRequestAdapter
}

/**
 * 把旧版 HttpAdapter 包装为 alova requestAdapter
 *
 * @param adapter 旧版 HttpAdapter
 * @param fallbackTimeoutMs 默认超时时间
 * @returns 兼容 requestAdapter
 */
export function createLegacyHttpAdapterRequestAdapter(
  adapter: HttpAdapter,
  fallbackTimeoutMs: number,
): ApiClientRequestAdapter {
  const requestAdapter: AlovaRequestAdapter<ApiMethodConfigLike, unknown, Headers> = (
    elements,
    method,
  ) => {
    const methodConfig = method.config as ApiMethodConfigLike
    const requestAbortController = new AbortController()
    let responsePromise: Promise<HttpAdapterResponse> | null = null

    const sendRequest = () => {
      if (!responsePromise) {
        const configRecord = methodConfig as Record<string, unknown>
        const {
          headers: _headers,
          params: _params,
          timeout: _timeout,
          cacheFor: _cacheFor,
          shareRequest: _shareRequest,
          transform: _transform,
          hitSource: _hitSource,
          name: _name,
          meta: _meta,
          ...requestInit
        } = configRecord

        responsePromise = adapter.request({
          url: elements.url,
          method: String(elements.type).toUpperCase(),
          headers: Object.fromEntries(Object.entries(elements.headers ?? {})),
          body: (elements.data ?? null) as BodyInit | null,
          timeoutMs: methodConfig.timeout ?? fallbackTimeoutMs,
          signal: requestAbortController.signal,
          requestInit: requestInit as RequestInit,
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

  return requestAdapter as ApiClientRequestAdapter
}

/**
 * 判断是否是旧版 HttpAdapter
 *
 * @param adapter 待判断对象
 * @returns 是否为 HttpAdapter
 */
export function isHttpAdapter(adapter: unknown): adapter is HttpAdapter {
  return (
    typeof adapter === 'object' &&
    adapter !== null &&
    'request' in adapter &&
    typeof (adapter as HttpAdapter).request === 'function'
  )
}

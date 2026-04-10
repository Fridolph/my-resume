import { createAlova, type AlovaRequestAdapter, type MethodType } from 'alova'
import type { FetchRequestInit } from 'alova/fetch'

import type {
  ApiRequestInput,
  HttpAdapter,
  HttpAdapterResponse,
  HttpMethod,
} from '../types/client.types'

const EMPTY_BODY = ''

interface AlovaMethodRequestConfig {
  requestInit?: Omit<FetchRequestInit, 'body' | 'headers' | 'method' | 'signal'>
}

/**
 * 请求执行输入
 */
export interface ExecuteWithAlovaInput {
  body?: BodyInit | null
  headers: Record<string, string>
  method: HttpMethod
  requestInit?: ApiRequestInput['requestInit']
  timeoutMs: number
  url: string
}

function isBodyAllowed(method: HttpMethod): boolean {
  const normalizedMethod = method.toUpperCase()
  return normalizedMethod !== 'GET' && normalizedMethod !== 'HEAD'
}

function createAlovaAdapter(
  adapter: HttpAdapter,
  fallbackTimeoutMs: number,
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
        // 懒执行请求并缓存 Promise，保证同一 method 生命周期内复用同一响应
        responsePromise = adapter.request({
          url: elements.url,
          method: String(elements.type).toUpperCase(),
          headers: Object.fromEntries(Object.entries(elements.headers ?? {})),
          body: (elements.data ?? null) as BodyInit | null,
          timeoutMs: methodConfig.timeout ?? fallbackTimeoutMs,
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

/**
 * 创建 alova 执行器
 *
 * @param adapter 底层 HTTP 适配器
 * @param fallbackTimeoutMs 回退超时
 * @returns 可直接执行请求的函数
 */
export function createAlovaRequestExecutor(
  adapter: HttpAdapter,
  fallbackTimeoutMs: number,
) {
  const alovaInstance = createAlova({
    requestAdapter: createAlovaAdapter(adapter, fallbackTimeoutMs),
    cacheFor: null,
    responded: {
      onSuccess: (response) => response,
    },
  })

  return async function executeWithAlova(
    input: ExecuteWithAlovaInput,
  ): Promise<HttpAdapterResponse> {
    const methodConfig = {
      headers: input.headers,
      timeout: input.timeoutMs,
      requestInit: input.requestInit,
    }

    // 用映射表分发标准方法，避免长 if/else 链
    const methodRequestMap: Record<string, () => Promise<HttpAdapterResponse>> = {
      GET: () => alovaInstance.Get(input.url, methodConfig) as Promise<HttpAdapterResponse>,
      POST: () =>
        alovaInstance.Post(
          input.url,
          input.body ?? EMPTY_BODY,
          methodConfig,
        ) as Promise<HttpAdapterResponse>,
      PUT: () =>
        alovaInstance.Put(
          input.url,
          input.body ?? EMPTY_BODY,
          methodConfig,
        ) as Promise<HttpAdapterResponse>,
      PATCH: () =>
        alovaInstance.Patch(
          input.url,
          input.body ?? EMPTY_BODY,
          methodConfig,
        ) as Promise<HttpAdapterResponse>,
      DELETE: () =>
        alovaInstance.Delete(
          input.url,
          input.body ?? EMPTY_BODY,
          methodConfig,
        ) as Promise<HttpAdapterResponse>,
      HEAD: () => alovaInstance.Head(input.url, methodConfig) as Promise<HttpAdapterResponse>,
      OPTIONS: () =>
        alovaInstance.Options(input.url, methodConfig) as Promise<HttpAdapterResponse>,
    }

    const requestByMethod = methodRequestMap[input.method]

    if (requestByMethod) {
      return requestByMethod()
    }

    return (await alovaInstance.Request({
      url: input.url,
      method: input.method as MethodType,
      headers: input.headers,
      data: isBodyAllowed(input.method) ? (input.body ?? undefined) : undefined,
      timeout: input.timeoutMs,
      requestInit: input.requestInit,
    })) as HttpAdapterResponse
  }
}

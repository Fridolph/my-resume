import type { AlovaGenerics, Method } from 'alova'
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
 * alova Method 实例
 */
export type ApiClientMethod<T = unknown> = Method<AlovaGenerics<T>>

/**
 * API client 请求输入
 */
export type ApiResponseType = 'json' | 'text' | 'raw'

export interface ApiRequestInput<T = unknown> {
  accessToken?: string
  apiBaseUrl: string
  body?: BodyInit | null
  fallbackErrorMessage: string
  headers?: Record<string, string>
  method?: HttpMethod
  pathname: string
  query?: Record<string, string | number | boolean | null | undefined>
  requestInit?: Omit<FetchRequestInit, 'body' | 'headers' | 'method'>
  responseType?: ApiResponseType
  returnNullOnNotFound?: boolean
  transform?: (payload: unknown) => T
}

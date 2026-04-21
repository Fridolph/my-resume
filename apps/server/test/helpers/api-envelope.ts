interface ResponseLike {
  body: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * 兼容读取 API 响应 payload。
 *
 * - 新结构：{ code, message, data, ... } -> 返回 data
 * - 旧结构：直接业务对象 -> 原样返回
 */
export function readApiData<T>(response: ResponseLike): T {
  const body = response.body

  if (!isRecord(body)) {
    return body as T
  }

  if ('data' in body) {
    return body.data as T
  }

  return body as T
}

/**
 * 兼容读取登录响应中的 accessToken。
 */
export function readAccessToken(response: ResponseLike): string {
  const payload = readApiData<{ accessToken?: string }>(response)

  if (!payload.accessToken) {
    throw new Error('Missing accessToken in login response payload')
  }

  return payload.accessToken
}

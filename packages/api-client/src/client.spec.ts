import { describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import {
  createApiClient,
  createAxiosAdapter,
  type HttpAdapterResponse,
} from './client'

function createMockResponse(status: number, payload: unknown): HttpAdapterResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(),
    json: async () => {
      if (typeof payload === 'string') {
        throw new Error('Invalid JSON payload')
      }

      return payload
    },
    text: async () => {
      if (typeof payload === 'string') {
        return payload
      }

      return JSON.stringify(payload)
    },
    raw: {
      status,
      payload,
    },
  }
}

describe('api client core', () => {
  it('retries GET request on retryable http status', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(createMockResponse(503, { message: 'Service unavailable' }))
      .mockResolvedValueOnce(createMockResponse(200, { ok: true }))
    const client = createApiClient({
      adapter: {
        request,
      },
      getRetryPolicy: {
        maxRetries: 1,
        baseDelayMs: 0,
        maxDelayMs: 0,
      },
    })

    const result = await client.request<{
      ok: boolean
    }>({
      apiBaseUrl: 'http://localhost:5577',
      pathname: '/health',
      fallbackErrorMessage: '请求失败',
    })

    expect(request).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(true)
  })

  it('does not retry non-GET request by default', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(createMockResponse(500, { message: '写入失败' }))
    const client = createApiClient({
      adapter: {
        request,
      },
    })

    await expect(
      client.request({
        apiBaseUrl: 'http://localhost:5577',
        pathname: '/demo',
        method: 'POST',
        body: JSON.stringify({
          foo: 'bar',
        }),
        fallbackErrorMessage: '写入失败',
      }),
    ).rejects.toThrow('写入失败')

    expect(request).toHaveBeenCalledTimes(1)
  })

  it('retries GET request on transport errors', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Network failed'))
      .mockResolvedValueOnce(createMockResponse(200, { ok: true }))
    const client = createApiClient({
      adapter: {
        request,
      },
      getRetryPolicy: {
        maxRetries: 1,
        baseDelayMs: 0,
        maxDelayMs: 0,
      },
    })

    const result = await client.request<{
      ok: boolean
    }>({
      apiBaseUrl: 'http://localhost:5577',
      pathname: '/health',
      fallbackErrorMessage: '请求失败',
    })

    expect(request).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(true)
  })

  it('returns null when configured to allow not-found', async () => {
    const request = vi
      .fn()
      .mockResolvedValue(createMockResponse(404, { message: 'Not Found' }))
    const client = createApiClient({
      adapter: {
        request,
      },
    })

    const result = await client.request<{
      status: string
    } | null>({
      apiBaseUrl: 'http://localhost:5577',
      pathname: '/missing',
      fallbackErrorMessage: '读取失败',
      returnNullOnNotFound: true,
    })

    expect(result).toBeNull()
  })

  it('applies default and per-request timeout policies', async () => {
    const request = vi.fn().mockResolvedValue(createMockResponse(200, { ok: true }))
    const client = createApiClient({
      adapter: {
        request,
      },
    })

    await client.request({
      apiBaseUrl: 'http://localhost:5577',
      pathname: '/read',
      fallbackErrorMessage: '读取失败',
    })

    await client.request({
      apiBaseUrl: 'http://localhost:5577',
      pathname: '/write',
      method: 'POST',
      body: JSON.stringify({
        hello: 'world',
      }),
      fallbackErrorMessage: '写入失败',
      requestPolicy: {
        timeoutMs: 3_000,
      },
    })

    expect(request).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        timeoutMs: 10_000,
      }),
    )
    expect(request).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        timeoutMs: 3_000,
      }),
    )
  })

  it('requires an injected axios instance for axios adapter', () => {
    expect(() => createAxiosAdapter()).toThrow(
      'createAxiosAdapter 需要传入 axios 实例',
    )
  })

  it('does not use direct Alova.request calls in domain facades', () => {
    const currentDir = fileURLToPath(new URL('.', import.meta.url))
    const domainFiles = ['auth.ts', 'resume.ts', 'ai.ts']
    const directCallPattern = /\bAlova\.request\s*\(/

    for (const fileName of domainFiles) {
      const fileContent = readFileSync(join(currentDir, fileName), 'utf-8')
      expect(directCallPattern.test(fileContent)).toBe(false)
    }
  })
})

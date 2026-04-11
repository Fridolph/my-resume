import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'

import { defaultApiClient } from './client'

function createJsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('api client core', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('injects bearer token via beforeRequest hook', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(200, { ok: true })),
    )

    await defaultApiClient
      .createMethod<{ ok: boolean }>({
        apiBaseUrl: 'http://localhost:5577',
        pathname: '/auth/me',
        accessToken: 'demo-token',
        fallbackErrorMessage: '读取失败',
      })
      .send()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5577/auth/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer demo-token',
        }),
      }),
    )
  })

  it('returns null when 404 is allowed', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(404, { message: 'Not Found' })),
    )

    const result = await defaultApiClient
      .createMethod<{ status: string } | null>({
        apiBaseUrl: 'http://localhost:5577',
        pathname: '/missing',
        fallbackErrorMessage: '读取失败',
        returnNullOnNotFound: true,
      })
      .send()

    expect(result).toBeNull()
  })

  it('parses text responses when requested', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('plain text body', {
          status: 200,
          headers: {
            'Content-Type': 'text/plain',
          },
        }),
      ),
    )

    const result = await defaultApiClient
      .createMethod<string>({
        apiBaseUrl: 'http://localhost:5577',
        pathname: '/text',
        fallbackErrorMessage: '读取失败',
        responseType: 'text',
      })
      .send()

    expect(result).toBe('plain text body')
  })

  it('extracts error messages from json payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(createJsonResponse(500, { message: '服务繁忙' })),
    )

    await expect(
      defaultApiClient
        .createMethod({
          apiBaseUrl: 'http://localhost:5577',
          pathname: '/broken',
          fallbackErrorMessage: '读取失败',
        })
        .send(),
    ).rejects.toThrow('服务繁忙')
  })

  it('preserves transport errors from fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')))

    await expect(
      defaultApiClient
        .createMethod({
          apiBaseUrl: 'http://localhost:5577',
          pathname: '/broken',
          fallbackErrorMessage: '网络异常，请稍后重试',
        })
        .send(),
    ).rejects.toThrow('network down')
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

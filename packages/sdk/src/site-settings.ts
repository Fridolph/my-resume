import type { ApiResponse, SiteSettingsRecord } from '@repo/types'

export interface PlatformApiClientOptions {
  baseUrl: string
  fetcher?: typeof fetch
}

export class PlatformApiError extends Error {
  code: string
  statusCode: number
  details?: unknown

  constructor(input: { code: string, message: string, statusCode: number, details?: unknown }) {
    super(input.message)
    this.name = 'PlatformApiError'
    this.code = input.code
    this.statusCode = input.statusCode
    this.details = input.details
  }
}

export async function requestApi<T>(
  path: string,
  init: RequestInit | undefined,
  options: PlatformApiClientOptions
): Promise<T> {
  const fetcher = options.fetcher ?? fetch
  const response = await fetcher(new URL(path, `${options.baseUrl}/`).toString(), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  })

  const payload = await response.json() as ApiResponse<T>

  if (!response.ok || !payload.success) {
    const errorPayload = 'error' in payload
      ? payload.error
      : {
          code: 'HTTP_ERROR',
          message: `Request failed with status ${response.status}`,
          statusCode: response.status
        }

    throw new PlatformApiError(errorPayload)
  }

  return payload.data
}

export function createPlatformApiClient(options: PlatformApiClientOptions) {
  return {
    async getSiteSettings() {
      return await requestApi<SiteSettingsRecord>('site-settings', undefined, options)
    },
    async updateSiteSettings(record: SiteSettingsRecord) {
      return await requestApi<SiteSettingsRecord>('site-settings', {
        method: 'PUT',
        body: JSON.stringify(record)
      }, options)
    }
  }
}

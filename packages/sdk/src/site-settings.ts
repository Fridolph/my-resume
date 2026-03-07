import type { SiteSettingsRecord } from '@repo/types'

export interface PlatformApiClientOptions {
  baseUrl: string
  fetcher?: typeof fetch
}

async function requestJson<T>(
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

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `Request failed with status ${response.status}`)
  }

  return await response.json() as T
}

export function createPlatformApiClient(options: PlatformApiClientOptions) {
  return {
    async getSiteSettings() {
      return await requestJson<SiteSettingsRecord>('site-settings', undefined, options)
    },
    async updateSiteSettings(record: SiteSettingsRecord) {
      return await requestJson<SiteSettingsRecord>('site-settings', {
        method: 'PUT',
        body: JSON.stringify(record)
      }, options)
    }
  }
}

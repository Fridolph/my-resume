import type { ResumeDocument } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { createTranslationsApiClient } from './translations.js'

export function createResumeApiClient(options: PlatformApiClientOptions) {
  const baseClient = createTranslationsApiClient(options)

  async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
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

  return {
    ...baseClient,
    async getResumeDocument() {
      return await requestJson<ResumeDocument>('resume')
    },
    async updateResumeDocument(record: ResumeDocument) {
      return await requestJson<ResumeDocument>('resume', {
        method: 'PUT',
        body: JSON.stringify(record)
      })
    }
  }
}

import type { PublishStatus, TranslationNamespace, TranslationRecord, WebLocale } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { createUsersApiClient } from './users.js'

export interface UpdateTranslationInput {
  namespace: TranslationNamespace
  key: string
  locale: WebLocale
  value: string
  status: PublishStatus
}

export function createTranslationsApiClient(options: PlatformApiClientOptions) {
  const baseClient = createUsersApiClient(options)

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
    async listTranslations() {
      return await requestJson<TranslationRecord[]>('translations')
    },
    async updateTranslation(translationId: string, input: UpdateTranslationInput) {
      return await requestJson<TranslationRecord>(`translations/${translationId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
      })
    }
  }
}

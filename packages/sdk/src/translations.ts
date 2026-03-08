import type { PublishStatus, TranslationNamespace, TranslationRecord, TranslationVersionRecord, WebLocale } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { requestApi } from './site-settings.js'
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

  return {
    ...baseClient,
    async listTranslations() {
      return await requestApi<TranslationRecord[]>('translations', undefined, options)
    },
    async listTranslationVersions(translationId: string) {
      return await requestApi<TranslationVersionRecord[]>(`translations/${translationId}/versions`, undefined, options)
    },
    async updateTranslation(translationId: string, input: UpdateTranslationInput) {
      return await requestApi<TranslationRecord>(`translations/${translationId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
      }, options)
    }
  }
}

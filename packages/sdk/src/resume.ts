import type { ResumeDocument, ResumeVersionRecord } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { requestApi } from './site-settings.js'
import { createTranslationsApiClient } from './translations.js'

export function createResumeApiClient(options: PlatformApiClientOptions) {
  const baseClient = createTranslationsApiClient(options)

  return {
    ...baseClient,
    async getResumeDocument() {
      return await requestApi<ResumeDocument>('resume', undefined, options)
    },
    async listResumeVersions() {
      return await requestApi<ResumeVersionRecord[]>('resume/versions', undefined, options)
    },
    async updateResumeDocument(record: ResumeDocument) {
      return await requestApi<ResumeDocument>('resume', {
        method: 'PUT',
        body: JSON.stringify(record)
      }, options)
    }
  }
}

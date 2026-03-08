import type { ProjectRecord, PublicReleaseSnapshot, ResumeDocument, SiteSettingsRecord, TranslationRecord, WebLocale } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { requestApi } from './site-settings.js'

export function createPublicContentApiClient(options: PlatformApiClientOptions) {
  return {
    async getActiveRelease() {
      return await requestApi<PublicReleaseSnapshot>('release', undefined, options)
    },
    async getSiteSettings() {
      return await requestApi<SiteSettingsRecord>('site-settings', undefined, options)
    },
    async getResumeDocument() {
      return await requestApi<ResumeDocument>('resume', undefined, options)
    },
    async listProjects() {
      return await requestApi<ProjectRecord[]>('projects', undefined, options)
    },
    async listTranslations(locale?: WebLocale) {
      const path = locale ? `translations?locale=${encodeURIComponent(locale)}` : 'translations'
      return await requestApi<TranslationRecord[]>(path, undefined, options)
    }
  }
}

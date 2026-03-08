import type { ContentReleaseRecord, PublicReleaseSnapshot } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { requestApi } from './site-settings.js'
import { createProjectsApiClient } from './projects.js'

export function createReleasesApiClient(options: PlatformApiClientOptions) {
  const baseClient = createProjectsApiClient(options)

  return {
    ...baseClient,
    async listContentReleases() {
      return await requestApi<ContentReleaseRecord[]>('releases', undefined, options)
    },
    async publishContentRelease() {
      return await requestApi<ContentReleaseRecord>('releases/publish', {
        method: 'POST'
      }, options)
    },
    async activateContentRelease(releaseId: string) {
      return await requestApi<ContentReleaseRecord>(`releases/${releaseId}/activate`, {
        method: 'POST'
      }, options)
    },
    async getActiveRelease() {
      return await requestApi<PublicReleaseSnapshot>('release', undefined, options)
    }
  }
}

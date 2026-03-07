import type { AuthLoginInput, AuthLoginResult, UserSession } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { createPlatformApiClient, requestApi } from './site-settings.js'

export function createAuthApiClient(options: PlatformApiClientOptions) {
  const baseClient = createPlatformApiClient(options)

  return {
    ...baseClient,
    async login(input: AuthLoginInput) {
      return await requestApi<AuthLoginResult>('auth/login', {
        method: 'POST',
        body: JSON.stringify(input)
      }, options)
    },
    async logout() {
      return await requestApi<{ success: boolean }>('auth/logout', {
        method: 'POST'
      }, options)
    },
    async getCurrentUser() {
      return await requestApi<UserSession>('auth/me', undefined, options)
    }
  }
}

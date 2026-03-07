import { createUsersApiClient } from '@repo/sdk'

export function usePlatformApiClient() {
  const runtimeConfig = useRuntimeConfig()

  return createUsersApiClient({
    baseUrl: runtimeConfig.public.apiBaseUrl
  })
}

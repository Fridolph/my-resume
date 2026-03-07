import { createPlatformApiClient } from '@repo/sdk'

export function usePlatformApiClient() {
  const runtimeConfig = useRuntimeConfig()

  return createPlatformApiClient({
    baseUrl: runtimeConfig.public.apiBaseUrl
  })
}

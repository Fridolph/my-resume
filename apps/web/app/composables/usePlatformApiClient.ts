import { createPublicContentApiClient } from '@repo/sdk'

export function usePlatformApiClient() {
  const runtimeConfig = useRuntimeConfig()

  return createPublicContentApiClient({
    baseUrl: runtimeConfig.public.publicApiBaseUrl
  })
}

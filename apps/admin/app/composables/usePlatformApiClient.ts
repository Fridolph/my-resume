import { createResumeApiClient } from '@repo/sdk'

export function usePlatformApiClient() {
  const runtimeConfig = useRuntimeConfig()

  return createResumeApiClient({
    baseUrl: runtimeConfig.public.apiBaseUrl
  })
}

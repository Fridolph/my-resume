import { createProjectsApiClient } from '@repo/sdk'

export function usePlatformApiClient() {
  const runtimeConfig = useRuntimeConfig()

  return createProjectsApiClient({
    baseUrl: runtimeConfig.public.apiBaseUrl
  })
}

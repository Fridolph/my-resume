import { createTranslationsApiClient } from '@repo/sdk'

export function usePlatformApiClient() {
  const runtimeConfig = useRuntimeConfig()

  return createTranslationsApiClient({
    baseUrl: runtimeConfig.public.apiBaseUrl
  })
}

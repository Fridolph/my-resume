import { createReleasesApiClient } from '@repo/sdk'

export function usePlatformApiClient() {
  const runtimeConfig = useRuntimeConfig()
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}

  return createReleasesApiClient({
    baseUrl: runtimeConfig.public.adminApiBaseUrl,
    fetcher: (input, init) => {
      return fetch(input, {
        ...init,
        credentials: init?.credentials ?? 'include',
        headers: {
          ...(requestHeaders ?? {}),
          ...(init?.headers ?? {})
        }
      })
    }
  })
}

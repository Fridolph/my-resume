interface SiteLocaleDefinition {
  code: string
  iso: string
  name: string
}

export function useSiteSeoConfig() {
  const runtimeConfig = useRuntimeConfig()

  const siteUrl = computed(() => runtimeConfig.public.siteUrl)
  const siteName = computed(() => runtimeConfig.public.siteName)
  const siteDescription = computed(() => runtimeConfig.public.siteDescription)
  const defaultLocale = computed(() => runtimeConfig.public.defaultLocale)
  const locales = computed(() => runtimeConfig.public.locales as SiteLocaleDefinition[])
  const defaultOgImage = computed(() => `${siteUrl.value}/og-default.svg`)

  function resolveUrl(path = '/') {
    return new URL(path, siteUrl.value).toString()
  }

  return {
    siteUrl,
    siteName,
    siteDescription,
    defaultLocale,
    locales,
    defaultOgImage,
    resolveUrl
  }
}

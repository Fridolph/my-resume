import type { SiteSettingsRecord } from '@repo/types'

interface SiteLocaleDefinition {
  code: string
  iso: string
  name: string
}

export function useSiteSeoConfig() {
  const runtimeConfig = useRuntimeConfig()
  const siteSettings = useState<SiteSettingsRecord | null>('web-site-settings', () => null)

  const siteUrl = computed(() => siteSettings.value?.seo.siteUrl ?? runtimeConfig.public.siteUrl)
  const siteName = computed(() => siteSettings.value?.seo.title ?? runtimeConfig.public.siteName)
  const siteDescription = computed(() => siteSettings.value?.seo.description ?? runtimeConfig.public.siteDescription)
  const defaultLocale = computed(() => siteSettings.value?.defaultLocale ?? runtimeConfig.public.defaultLocale)
  const locales = computed(() => runtimeConfig.public.locales as SiteLocaleDefinition[])
  const defaultOgImage = computed(() => siteSettings.value?.seo.ogImage ?? `${siteUrl.value}/og-default.svg`)

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

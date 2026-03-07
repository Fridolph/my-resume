interface UsePageSeoOptions {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'profile' | 'article'
  noIndex?: boolean
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>
}

export function usePageSeo(options: UsePageSeoOptions) {
  const { locale } = useWebLocale()
  const {
    siteName,
    defaultOgImage,
    resolveUrl
  } = useSiteSeoConfig()

  const canonicalUrl = computed(() => resolveUrl(options.path ?? '/'))
  const seoTitle = computed(() => options.title)
  const seoDescription = computed(() => options.description)
  const seoImage = computed(() => options.image ?? defaultOgImage.value)
  const localeCode = computed(() => locale.value.replace('-', '_'))

  useHead(() => ({
    link: [
      {
        rel: 'canonical',
        href: canonicalUrl.value
      }
    ],
    script: options.structuredData
      ? [
          {
            key: `ld-json-${options.path ?? 'root'}`,
            type: 'application/ld+json',
            innerHTML: JSON.stringify(options.structuredData)
          }
        ]
      : []
  }))

  useSeoMeta({
    title: seoTitle,
    description: seoDescription,
    ogTitle: seoTitle,
    ogDescription: seoDescription,
    ogUrl: canonicalUrl,
    ogImage: seoImage,
    ogType: options.type ?? 'website',
    ogLocale: localeCode,
    ogSiteName: siteName,
    twitterTitle: seoTitle,
    twitterDescription: seoDescription,
    twitterImage: seoImage,
    twitterCard: 'summary_large_image',
    robots: options.noIndex ? 'noindex, nofollow' : 'index, follow'
  })
}

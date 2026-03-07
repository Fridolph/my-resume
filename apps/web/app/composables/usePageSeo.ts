interface UsePageSeoOptions {
  title: string
  description: string
  path?: string
}

export function usePageSeo(options: UsePageSeoOptions) {
  const baseUrl = 'http://localhost:3000'
  const pageUrl = options.path ? `${baseUrl}${options.path}` : baseUrl

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogUrl: pageUrl,
    twitterCard: 'summary_large_image'
  })
}

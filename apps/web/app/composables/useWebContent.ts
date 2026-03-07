import {
  getHomePageContent,
  getProjectDetailContent,
  getProjectsPageContent,
  getResumePageContent
} from '@repo/sdk'

export function useHomePageContent() {
  const { locale } = useWebLocale()

  return useAsyncData('web-home-content', () => getHomePageContent(locale.value), {
    watch: [locale]
  })
}

export function useResumePageContent() {
  const { locale } = useWebLocale()

  return useAsyncData('web-resume-content', () => getResumePageContent(locale.value), {
    watch: [locale]
  })
}

export function useProjectsPageContent() {
  const { locale } = useWebLocale()

  return useAsyncData('web-projects-content', () => getProjectsPageContent(locale.value), {
    watch: [locale]
  })
}

export function useProjectDetailContent(slug: string) {
  const { locale } = useWebLocale()

  return useAsyncData(`web-project-detail-${slug}`, () => getProjectDetailContent(slug, locale.value), {
    watch: [locale]
  })
}

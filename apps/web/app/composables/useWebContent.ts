import {
  getHomePageContent,
  getProjectDetailContent,
  getProjectsPageContent,
  getResumePageContent
} from '@repo/sdk'

export function useHomePageContent() {
  return useAsyncData('web-home-content', () => getHomePageContent())
}

export function useResumePageContent() {
  return useAsyncData('web-resume-content', () => getResumePageContent())
}

export function useProjectsPageContent() {
  return useAsyncData('web-projects-content', () => getProjectsPageContent())
}

export function useProjectDetailContent(slug: string) {
  return useAsyncData(`web-project-detail-${slug}`, () => getProjectDetailContent(slug))
}

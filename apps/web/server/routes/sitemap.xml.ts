import { getProjectsPageContent } from '@repo/sdk'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const siteUrl = runtimeConfig.public.siteUrl
  const staticRoutes = ['/', '/resume', '/projects']
  const projectContent = await getProjectsPageContent('zh-CN')
  const dynamicRoutes = projectContent.projects.map(project => `/projects/${project.slug}`)
  const urls = [...staticRoutes, ...dynamicRoutes]

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(url => `  <url><loc>${new URL(url, siteUrl).toString()}</loc></url>`)
    .join('\n')}\n</urlset>`

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return body
})

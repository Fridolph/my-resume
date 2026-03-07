export default defineEventHandler((event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const siteUrl = runtimeConfig.public.siteUrl

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  return [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`
  ].join('\n')
})

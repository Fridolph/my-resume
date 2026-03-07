import { z } from 'zod'
import {
  getSiteSettingsRecord,
  updateSiteSettingsRecord
} from '@repo/database'

const siteSettingsSchema = z.object({
  id: z.string(),
  defaultLocale: z.enum(['zh-CN', 'en-US']),
  socialLinks: z.array(z.object({
    id: z.string(),
    label: z.string(),
    url: z.string()
  })),
  downloadLinks: z.array(z.object({
    id: z.string(),
    label: z.string(),
    url: z.string()
  })),
  seo: z.object({
    title: z.string(),
    description: z.string(),
    ogImage: z.string(),
    siteUrl: z.string()
  }),
  updatedAt: z.string()
})

export default defineEventHandler(async (event) => {
  const method = getMethod(event)

  if (method === 'GET') {
    return await getSiteSettingsRecord()
  }

  if (method === 'PUT') {
    const body = await readBody(event)
    const parsed = siteSettingsSchema.parse(body)
    return await updateSiteSettingsRecord(parsed)
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})

import { z } from 'zod'

export const siteSettingsSchema = z.object({
  id: z.string(),
  defaultLocale: z.enum(['zh-CN', 'en-US']),
  socialLinks: z.array(z.object({
    id: z.string(),
    label: z.string(),
    url: z.string().url()
  })),
  downloadLinks: z.array(z.object({
    id: z.string(),
    label: z.string(),
    url: z.string().url()
  })),
  seo: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    ogImage: z.string().url(),
    siteUrl: z.string().url()
  }),
  updatedAt: z.string()
})

import { z } from 'zod'

export const translationSchema = z.object({
  id: z.string(),
  namespace: z.enum(['common', 'resume', 'project', 'seo']),
  key: z.string().min(1),
  locale: z.enum(['zh-CN', 'en-US']),
  value: z.string(),
  status: z.enum(['draft', 'reviewing', 'published', 'archived']),
  missing: z.boolean()
})

export const updateTranslationSchema = translationSchema.omit({ id: true, missing: true })

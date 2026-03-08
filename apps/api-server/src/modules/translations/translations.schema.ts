import { z } from 'zod'

const contentActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
})

export const translationSchema = z.object({
  id: z.string(),
  namespace: z.enum(['common', 'resume', 'project', 'seo']),
  key: z.string().min(1),
  locale: z.enum(['zh-CN', 'en-US']),
  value: z.string(),
  status: z.enum(['draft', 'reviewing', 'published', 'archived']),
  missing: z.boolean(),
  updatedBy: contentActorSchema.nullable().optional(),
  reviewedBy: contentActorSchema.nullable().optional(),
  publishedAt: z.string().nullable().optional()
})

export const updateTranslationSchema = translationSchema.omit({ id: true, missing: true, updatedBy: true, reviewedBy: true, publishedAt: true })

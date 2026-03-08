import { z } from 'zod'

const projectLocaleContentSchema = z.object({
  locale: z.enum(['zh-CN', 'en-US']),
  title: z.string(),
  description: z.string(),
  summary: z.string()
})

const contentActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
})

export const projectSchema = z.object({
  id: z.string(),
  slug: z.string().min(1),
  status: z.enum(['draft', 'reviewing', 'published', 'archived']),
  sortOrder: z.number().int().min(1),
  cover: z.string().url(),
  externalUrl: z.string().url(),
  tags: z.array(z.string()),
  locales: z.object({
    'zh-CN': projectLocaleContentSchema,
    'en-US': projectLocaleContentSchema
  }),
  updatedBy: contentActorSchema.nullable().optional(),
  reviewedBy: contentActorSchema.nullable().optional(),
  publishedAt: z.string().nullable().optional()
})

export const createProjectSchema = projectSchema.omit({ id: true, updatedBy: true, reviewedBy: true, publishedAt: true })
export const updateProjectSchema = projectSchema.omit({ id: true, updatedBy: true, reviewedBy: true, publishedAt: true })

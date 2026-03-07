import { z } from 'zod'

const projectLocaleContentSchema = z.object({
  locale: z.enum(['zh-CN', 'en-US']),
  title: z.string(),
  description: z.string(),
  summary: z.string()
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
  })
})

export const createProjectSchema = projectSchema.omit({ id: true })
export const updateProjectSchema = projectSchema.omit({ id: true })

import { z } from 'zod'

const contentActorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email()
})

const resumeBaseInfoSchema = z.object({
  fullName: z.string().min(1),
  headline: z.string().min(1),
  location: z.string(),
  summary: z.string()
})

const resumeEducationItemSchema = z.object({
  id: z.string(),
  school: z.string(),
  degree: z.string(),
  period: z.string(),
  summary: z.string()
})

const resumeExperienceItemSchema = z.object({
  id: z.string(),
  company: z.string(),
  role: z.string(),
  period: z.string(),
  summary: z.string()
})

const resumeSkillGroupSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(z.string())
})

const resumeContactItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  href: z.string().optional()
})

const resumeLocaleContentSchema = z.object({
  locale: z.enum(['zh-CN', 'en-US']),
  baseInfo: resumeBaseInfoSchema,
  education: z.array(resumeEducationItemSchema),
  experiences: z.array(resumeExperienceItemSchema),
  skillGroups: z.array(resumeSkillGroupSchema),
  contacts: z.array(resumeContactItemSchema)
})

export const resumeDocumentSchema = z.object({
  id: z.string(),
  status: z.enum(['draft', 'reviewing', 'published', 'archived']),
  updatedAt: z.string(),
  updatedBy: contentActorSchema.nullable().optional(),
  reviewedBy: contentActorSchema.nullable().optional(),
  publishedAt: z.string().nullable().optional(),
  locales: z.object({
    'zh-CN': resumeLocaleContentSchema,
    'en-US': resumeLocaleContentSchema
  })
})

import { z } from 'zod'

export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'translator']),
  status: z.enum(['active', 'disabled'])
})

export const createUserSchema = userSchema.omit({ id: true })
export const updateUserSchema = userSchema.omit({ id: true })

import { z } from 'zod'

export const authLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

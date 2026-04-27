import { describe, expect, it } from 'vitest'

import { PasswordHashService } from '../application/services/password-hash.service'

describe('PasswordHashService', () => {
  const passwordHashService = new PasswordHashService()

  it('should hash and verify a valid password', async () => {
    const hashedPassword = await passwordHashService.hashPassword('admin123456')

    await expect(
      passwordHashService.verifyPassword('admin123456', hashedPassword),
    ).resolves.toBe(true)
  })

  it('should reject mismatched passwords', async () => {
    const hashedPassword = await passwordHashService.hashPassword('admin123456')

    await expect(
      passwordHashService.verifyPassword('wrong-password', hashedPassword),
    ).resolves.toBe(false)
  })

  it('should reject malformed hash payload', async () => {
    await expect(
      passwordHashService.verifyPassword('admin123456', 'malformed-hash'),
    ).resolves.toBe(false)
  })
})

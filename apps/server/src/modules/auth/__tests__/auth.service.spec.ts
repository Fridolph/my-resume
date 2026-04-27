import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { JwtService } from '@nestjs/jwt'

import { AuthService } from '../auth.service'
import { PasswordHashService } from '../application/services/password-hash.service'
import { UserRole } from '../domain/user-role.enum'
import type { AuthUserRecord } from '../infrastructure/repositories/auth-user.repository'

describe('AuthService', () => {
  const passwordHashService = new PasswordHashService()

  const jwtService = new JwtService({
    secret: 'test-jwt-secret',
    signOptions: {
      expiresIn: '1h',
    },
  })

  const authUserRepository = {
    findById: vi.fn<(id: string) => Promise<AuthUserRecord | null>>(),
    findByUsername: vi.fn<(username: string) => Promise<AuthUserRecord | null>>(),
    updateLastLoginAt: vi.fn<(id: string) => Promise<void>>(),
  }

  const authService = new AuthService(
    jwtService,
    authUserRepository,
    passwordHashService,
  )

  let adminPasswordHash: string

  beforeAll(async () => {
    adminPasswordHash = await passwordHashService.hashPassword('admin123456')
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should issue an access token for the active admin user', async () => {
    authUserRepository.findByUsername.mockResolvedValue({
      id: 'admin-demo-user',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    })
    authUserRepository.updateLastLoginAt.mockResolvedValue(undefined)

    const loginResult = await authService.login({
      username: 'admin',
      password: 'admin123456',
    })

    expect(loginResult.tokenType).toBe('Bearer')
    expect(loginResult.accessToken).toEqual(expect.any(String))
    expect(loginResult.user).toMatchObject({
      username: 'admin',
      role: UserRole.ADMIN,
      isActive: true,
    })
    expect(loginResult.user.capabilities.canTriggerAiAnalysis).toBe(true)
    expect(authUserRepository.updateLastLoginAt).toHaveBeenCalledWith('admin-demo-user')
  })

  it('should reject invalid credentials', async () => {
    authUserRepository.findByUsername.mockResolvedValue({
      id: 'admin-demo-user',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    })

    await expect(
      authService.login({
        username: 'admin',
        password: 'wrong-password',
      }),
    ).rejects.toThrow('Invalid credentials')
  })
})

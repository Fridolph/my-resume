import { beforeEach, describe, expect, it, vi } from 'vitest'

import { UserRole } from '../domain/user-role.enum'
import { AuthUserSeedService } from '../application/services/auth-user-seed.service'

describe('AuthUserSeedService', () => {
  const authUserRepository = {
    ensureUsersTable: vi.fn<() => Promise<void>>(),
    findByUsername: vi.fn<(username: string) => Promise<unknown>>(),
    createUser: vi.fn<(input: unknown) => Promise<unknown>>(),
  }

  const passwordHashService = {
    hashPassword: vi.fn<(password: string) => Promise<string>>(),
  }

  const authUserSeedService = new AuthUserSeedService(
    authUserRepository as never,
    passwordHashService as never,
  )

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.AUTH_BOOTSTRAP_DEFAULT_USERS
    delete process.env.AUTH_ADMIN_USERNAME
    delete process.env.AUTH_ADMIN_PASSWORD
    delete process.env.AUTH_VIEWER_USERNAME
    delete process.env.AUTH_VIEWER_PASSWORD

    authUserRepository.ensureUsersTable.mockResolvedValue(undefined)
    passwordHashService.hashPassword.mockResolvedValue('hashed-password')
    authUserRepository.createUser.mockResolvedValue(null)
  })

  it('should skip bootstrap when disabled by env', async () => {
    process.env.AUTH_BOOTSTRAP_DEFAULT_USERS = 'false'

    await authUserSeedService.onModuleInit()

    expect(authUserRepository.ensureUsersTable).not.toHaveBeenCalled()
    expect(authUserRepository.createUser).not.toHaveBeenCalled()
  })

  it('should seed admin and viewer users when missing', async () => {
    authUserRepository.findByUsername.mockResolvedValue(null)

    await authUserSeedService.onModuleInit()

    expect(authUserRepository.ensureUsersTable).toHaveBeenCalledTimes(1)
    expect(passwordHashService.hashPassword).toHaveBeenNthCalledWith(1, 'admin123456')
    expect(passwordHashService.hashPassword).toHaveBeenNthCalledWith(2, 'viewer123456')
    expect(authUserRepository.createUser).toHaveBeenCalledTimes(2)
    expect(authUserRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'admin-demo-user',
        username: 'admin',
        role: UserRole.ADMIN,
      }),
    )
    expect(authUserRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'viewer-demo-user',
        username: 'viewer',
        role: UserRole.VIEWER,
      }),
    )
  })

  it('should skip existing users and only create missing ones', async () => {
    authUserRepository.findByUsername
      .mockResolvedValueOnce({
        id: 'existing-admin-user',
        username: 'admin',
      })
      .mockResolvedValueOnce(null)

    await authUserSeedService.onModuleInit()

    expect(authUserRepository.createUser).toHaveBeenCalledTimes(1)
    expect(authUserRepository.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'viewer-demo-user',
        username: 'viewer',
        role: UserRole.VIEWER,
      }),
    )
  })
})

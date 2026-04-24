import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'

import { UserRole } from '../../domain/user-role.enum'
import { AuthUserRepository } from '../../infrastructure/repositories/auth-user.repository'
import { PasswordHashService } from './password-hash.service'

function readEnvValue(name: string, fallbackValue: string) {
  const value = process.env[name]?.trim()

  return value || fallbackValue
}

@Injectable()
export class AuthUserSeedService implements OnModuleInit {
  private readonly logger = new Logger(AuthUserSeedService.name)

  constructor(
    @Inject(AuthUserRepository)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PasswordHashService)
    private readonly passwordHashService: PasswordHashService,
  ) {}

  async onModuleInit() {
    if (!this.shouldBootstrapDefaultUsers()) {
      this.logger.log('skip default auth-user bootstrap by AUTH_BOOTSTRAP_DEFAULT_USERS=false')

      return
    }

    await this.authUserRepository.ensureUsersTable()
    await this.ensureDefaultAdminUser()
    await this.ensureDefaultViewerUser()
  }

  private shouldBootstrapDefaultUsers() {
    return readEnvValue('AUTH_BOOTSTRAP_DEFAULT_USERS', 'true') !== 'false'
  }

  private async ensureDefaultAdminUser() {
    const username = readEnvValue('AUTH_ADMIN_USERNAME', 'admin')
    const password = readEnvValue('AUTH_ADMIN_PASSWORD', 'admin123456')

    await this.ensureDefaultUser({
      id: 'admin-demo-user',
      username,
      password,
      role: UserRole.ADMIN,
    })
  }

  private async ensureDefaultViewerUser() {
    const username = readEnvValue('AUTH_VIEWER_USERNAME', 'viewer')
    const password = readEnvValue('AUTH_VIEWER_PASSWORD', 'viewer123456')

    await this.ensureDefaultUser({
      id: 'viewer-demo-user',
      username,
      password,
      role: UserRole.VIEWER,
    })
  }

  private async ensureDefaultUser(input: {
    id: string
    username: string
    password: string
    role: UserRole
  }) {
    const existingUser = await this.authUserRepository.findByUsername(input.username)

    if (existingUser) {
      return
    }

    const now = new Date()
    const passwordHash = await this.passwordHashService.hashPassword(input.password)

    await this.authUserRepository.createUser({
      id: input.id,
      username: input.username,
      passwordHash,
      role: input.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    this.logger.log(`bootstrapped auth user: ${input.username}`)
  }
}

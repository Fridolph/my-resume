import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { buildRoleCapabilities } from '../../domain/auth-role-policy'
import { AuthUser } from '../../domain/auth-user'
import { LoginDto } from '../../dto/login.dto'
import { AuthTokenPayload } from '../../interfaces/auth-token-payload.interface'
import { AuthUserRecord, AuthUserRepository } from '../../infrastructure/repositories/auth-user.repository'
import { PasswordHashService } from './password-hash.service'

export interface AuthUserView extends AuthUser {
  capabilities: ReturnType<typeof buildRoleCapabilities>
}

export interface LoginResult {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  user: AuthUserView
}

const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 60 * 60

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(AuthUserRepository)
    private readonly authUserRepository: AuthUserRepository,
    @Inject(PasswordHashService)
    private readonly passwordHashService: PasswordHashService,
  ) {}

  /**
   * 完成登录鉴权并签发访问令牌
   * @param loginDto 登录参数
   * @returns 登录结果
   */
  async login(loginDto: LoginDto): Promise<LoginResult> {
    // 登录流程：先读数据库用户，再校验密码哈希，最后签发 JWT。
    const authUser = await this.validateCredentials(loginDto)

    if (!authUser) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const accessToken = await this.jwtService.signAsync({
      sub: authUser.id,
      username: authUser.username,
      role: authUser.role,
    })
    await this.authUserRepository.updateLastLoginAt(authUser.id)

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
      user: this.serializeUser(authUser),
    }
  }

  /**
   * 验证访问令牌并恢复当前用户
   * @param accessToken 访问令牌
   * @returns 鉴权用户
   */
  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    // 守卫只负责转交 token；真正校验和用户恢复在 service 完成。
    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(accessToken)
      const userRecord = await this.authUserRepository.findById(payload.sub)

      if (
        !userRecord ||
        !userRecord.isActive ||
        userRecord.username !== payload.username ||
        userRecord.role !== payload.role
      ) {
        throw new UnauthorizedException('Invalid token')
      }

      return this.toAuthUser(userRecord)
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error
      }

      throw new UnauthorizedException('Invalid token')
    }
  }

  /**
   * 将用户角色展开为前端可直接消费的能力集合
   * @param authUser 鉴权用户
   * @returns 带能力映射的用户视图
   */
  serializeUser(authUser: AuthUser): AuthUserView {
    // 前端使用 capabilities 直接驱动权限 UI，避免散落的 role 判断。
    return {
      ...authUser,
      capabilities: buildRoleCapabilities(authUser.role),
    }
  }

  private async validateCredentials(loginDto: LoginDto): Promise<AuthUser | null> {
    const userRecord = await this.authUserRepository.findByUsername(loginDto.username)

    if (!userRecord || !userRecord.isActive) {
      return null
    }

    const isPasswordValid = await this.passwordHashService.verifyPassword(
      loginDto.password,
      userRecord.passwordHash,
    )

    if (!isPasswordValid) {
      return null
    }

    return this.toAuthUser(userRecord)
  }

  private toAuthUser(account: AuthUserRecord): AuthUser {
    return {
      id: account.id,
      username: account.username,
      role: account.role,
      isActive: account.isActive,
    }
  }
}

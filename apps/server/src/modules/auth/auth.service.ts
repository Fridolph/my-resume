import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'

import { buildRoleCapabilities } from './domain/auth-role-policy'
import { AuthUser } from './domain/auth-user'
import { UserRole } from './domain/user-role.enum'
import { LoginDto } from './dto/login.dto'
import { AuthTokenPayload } from './interfaces/auth-token-payload.interface'

interface DemoAccount extends AuthUser {
  password: string
}

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

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'admin-demo-user',
    username: 'admin',
    password: 'admin123456',
    role: UserRole.ADMIN,
    isActive: true,
  },
  {
    id: 'viewer-demo-user',
    username: 'viewer',
    password: 'viewer123456',
    role: UserRole.VIEWER,
    isActive: true,
  },
]

@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  /**
   * 完成登录鉴权并签发访问令牌
   * @param loginDto 登录参数
   * @returns 登录结果
   */
  async login(loginDto: LoginDto): Promise<LoginResult> {
    // 教程型最小鉴权：先校验 demo 账号，再签发 JWT，并返回能力映射。
    const authUser = this.validateCredentials(loginDto)

    if (!authUser) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const accessToken = await this.jwtService.signAsync({
      sub: authUser.id,
      username: authUser.username,
      role: authUser.role,
    })

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

      const authUser = DEMO_ACCOUNTS.find(
        (account) =>
          account.id === payload.sub &&
          account.username === payload.username &&
          account.role === payload.role &&
          account.isActive,
      )

      if (!authUser) {
        throw new UnauthorizedException('Invalid token')
      }

      return this.stripPassword(authUser)
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

  private validateCredentials(loginDto: LoginDto): AuthUser | null {
    const account = DEMO_ACCOUNTS.find(
      (candidate) =>
        candidate.username === loginDto.username &&
        candidate.password === loginDto.password &&
        candidate.isActive,
    )

    return account ? this.stripPassword(account) : null
  }

  private stripPassword(account: DemoAccount): AuthUser {
    return {
      id: account.id,
      username: account.username,
      role: account.role,
      isActive: account.isActive,
    }
  }
}

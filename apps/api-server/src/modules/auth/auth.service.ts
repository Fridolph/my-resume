import { Injectable, UnauthorizedException } from '@nestjs/common'
import { authenticateUser, createAuthSession, resolveUserBySessionToken, revokeExpiredSessions, revokeSessionToken } from '@repo/database'
import type { UserRecord, UserSession } from '@repo/types'

@Injectable()
export class AuthService {
  async login(email: string, password: string) {
    await revokeExpiredSessions()

    const user = await authenticateUser(email, password)

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: '邮箱或密码不正确，或账号不可用。'
      })
    }

    const sessionState = await createAuthSession(user)

    return {
      session: this.toUserSession(user),
      ...sessionState
    }
  }

  async getCurrentUser(token: string | null) {
    if (!token) {
      throw new UnauthorizedException({
        code: 'AUTH_UNAUTHORIZED',
        message: '当前请求未登录。'
      })
    }

    const user = await resolveUserBySessionToken(token)

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_SESSION_EXPIRED',
        message: '登录态已失效，请重新登录。'
      })
    }

    return this.toUserSession(user.record)
  }

  async logout(token: string | null) {
    if (token) {
      await revokeSessionToken(token)
    }

    return {
      success: true
    }
  }

  private toUserSession(user: UserRecord): UserSession {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    }
  }
}

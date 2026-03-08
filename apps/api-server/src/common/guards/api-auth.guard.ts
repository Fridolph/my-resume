import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { resolveUserBySessionToken } from '@repo/database'
import type { PermissionKey, UserSession } from '@repo/types'
import type { Request } from 'express'
import { readAuthCookie } from '../auth/auth-cookie.js'
import { IS_PUBLIC_ROUTE } from '../decorators/public.decorator.js'
import { REQUIRED_PERMISSIONS } from '../decorators/require-permissions.decorator.js'

@Injectable()
export class ApiAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const isPublicRoute = Reflect.getMetadata(IS_PUBLIC_ROUTE, context.getHandler())
      ?? Reflect.getMetadata(IS_PUBLIC_ROUTE, context.getClass())
      ?? false

    if (isPublicRoute) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request & { currentUser?: UserSession }>()
    const token = readAuthCookie(request)

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

    const currentUser: UserSession = {
      id: user.record.id,
      name: user.record.name,
      email: user.record.email,
      role: user.record.role,
      permissions: user.record.permissions
    }

    request.currentUser = currentUser

    const requiredPermissions = Reflect.getMetadata(REQUIRED_PERMISSIONS, context.getHandler())
      ?? Reflect.getMetadata(REQUIRED_PERMISSIONS, context.getClass())
      ?? []

    if (requiredPermissions.length === 0) {
      return true
    }

    const hasAllPermissions = requiredPermissions.every((permission: PermissionKey) => currentUser.permissions.includes(permission))

    if (!hasAllPermissions) {
      throw new ForbiddenException({
        code: 'AUTH_FORBIDDEN',
        message: `当前账号缺少访问该接口所需权限：${requiredPermissions.join(', ')}`
      })
    }

    return true
  }
}

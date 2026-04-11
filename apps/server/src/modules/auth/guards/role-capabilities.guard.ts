import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { buildRoleCapabilities, RoleCapabilityKey } from '../domain/auth-role-policy'
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface'
import { REQUIRED_ROLE_CAPABILITY } from '../decorators/require-capability.decorator'

@Injectable()
export class RoleCapabilitiesGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  /**
   * 根据声明的能力键做角色能力校验
   * @param context Nest 执行上下文
   * @returns 是否允许继续执行
   */
  canActivate(context: ExecutionContext): boolean {
    // 第二层守卫只做能力确认，按 @RequireCapability 决定是否放行。
    const capability = this.reflector.getAllAndOverride<RoleCapabilityKey>(
      REQUIRED_ROLE_CAPABILITY,
      [context.getHandler(), context.getClass()],
    )

    if (!capability) {
      return true
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const authUser = request.authUser

    if (!authUser) {
      throw new ForbiddenException('Authentication context is missing')
    }

    const capabilities = buildRoleCapabilities(authUser.role)

    if (!capabilities[capability]) {
      throw new ForbiddenException('Current role is read-only')
    }

    return true
  }
}

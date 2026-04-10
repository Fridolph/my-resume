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

  canActivate(context: ExecutionContext): boolean {
    /**
     * 第二层守卫：只做“能力确认”
     * - 先读取 @RequireCapability 声明的能力键
     * - 再根据 authUser.role 展开 capabilities
     * - 如果当前能力不满足，则直接拒绝
     */
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

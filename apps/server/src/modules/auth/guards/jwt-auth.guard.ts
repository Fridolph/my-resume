import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'

import { AuthService } from '../auth.service'
import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface'

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    /**
     * 第一层守卫：只做“身份确认”
     * - 从 Authorization 头中取 Bearer token
     * - 调 AuthService.verifyAccessToken 校验
     * - 把结果挂到 request.authUser
     *
     * 后续 controller / capability guard 都依赖这一步的产物。
     */
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const bearerToken = request.headers.authorization

    if (!bearerToken?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token')
    }

    const accessToken = bearerToken.slice('Bearer '.length).trim()

    if (!accessToken) {
      throw new UnauthorizedException('Missing bearer token')
    }

    request.authUser = await this.authService.verifyAccessToken(accessToken)

    return true
  }
}

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

  /**
   * 校验 Bearer token 并把 authUser 注入到 request 上下文
   * @param context Nest 执行上下文
   * @returns 是否允许继续执行
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 第一层守卫只做身份确认，为后续能力守卫提供 authUser 上下文。
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

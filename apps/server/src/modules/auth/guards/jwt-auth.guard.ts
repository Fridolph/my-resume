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

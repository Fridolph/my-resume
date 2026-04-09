import { createParamDecorator, ExecutionContext } from '@nestjs/common'

import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface'

export const CurrentAuthUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    return request.authUser
  },
)

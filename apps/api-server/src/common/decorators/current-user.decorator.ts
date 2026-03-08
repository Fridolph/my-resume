import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { UserSession } from '@repo/types'

export const CurrentUser = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<{ currentUser?: UserSession }>()
  return request.currentUser ?? null
})

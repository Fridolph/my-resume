import { Request } from 'express'

import { AuthUser } from '../domain/auth-user'

export interface AuthenticatedRequest extends Request {
  authUser?: AuthUser
}

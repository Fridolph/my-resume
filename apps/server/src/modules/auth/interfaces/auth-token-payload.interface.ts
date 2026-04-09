import { UserRole } from '../domain/user-role.enum'

export interface AuthTokenPayload {
  sub: string
  username: string
  role: UserRole
  iat?: number
  exp?: number
}

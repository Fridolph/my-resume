import type { Request } from 'express'

export const AUTH_COOKIE_NAME = 'platform_admin_session'
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export function readAuthCookie(request: Request, cookieName = AUTH_COOKIE_NAME) {
  const header = request.headers.cookie

  if (!header) {
    return null
  }

  const cookie = header
    .split(';')
    .map((item: string) => item.trim())
    .find((item: string) => item.startsWith(`${cookieName}=`))

  return cookie ? decodeURIComponent(cookie.slice(cookieName.length + 1)) : null
}

import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res } from '@nestjs/common'
import type { Request, Response } from 'express'
import { authLoginSchema } from './auth.schema.js'
import { AuthService } from './auth.service.js'

const AUTH_COOKIE_NAME = 'platform_admin_session'
const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000

function readCookie(request: Request, cookieName: string) {
  const header = request.headers.cookie

  if (!header) {
    return null
  }

  const cookie = header.split(';').map((item: string) => item.trim()).find((item: string) => item.startsWith(`${cookieName}=`))
  return cookie ? decodeURIComponent(cookie.slice(cookieName.length + 1)) : null
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response) {
    const parsed = authLoginSchema.parse(body)
    const result = await this.authService.login(parsed.email, parsed.password)

    response.cookie(AUTH_COOKIE_NAME, result.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/',
      maxAge: AUTH_COOKIE_MAX_AGE
    })

    return {
      session: result.session,
      expiresAt: result.expiresAt
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = readCookie(request, AUTH_COOKIE_NAME)
    const result = await this.authService.logout(token)

    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/'
    })

    return result
  }

  @Get('me')
  async me(@Req() request: Request) {
    const token = readCookie(request, AUTH_COOKIE_NAME)
    return await this.authService.getCurrentUser(token)
  }
}

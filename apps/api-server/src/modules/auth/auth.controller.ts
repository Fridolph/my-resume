import { Body, Controller, Get, HttpCode, Inject, Post, Req, Res, UseGuards } from '@nestjs/common'
import type { Request, Response } from 'express'
import { Public } from '../../common/decorators/public.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { authLoginSchema } from './auth.schema.js'
import { AuthService } from './auth.service.js'

import { AUTH_COOKIE_MAX_AGE, AUTH_COOKIE_NAME, readAuthCookie } from '../../common/auth/auth-cookie.js'

@Controller('admin/auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Public()
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

  @UseGuards(ApiAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const token = readAuthCookie(request, AUTH_COOKIE_NAME)
    const result = await this.authService.logout(token)

    response.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/'
    })

    return result
  }

  @UseGuards(ApiAuthGuard)
  @Get('me')
  async me(@Req() request: Request) {
    const token = readAuthCookie(request, AUTH_COOKIE_NAME)
    return await this.authService.getCurrentUser(token)
  }
}

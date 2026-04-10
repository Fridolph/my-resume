import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'

import { CurrentAuthUser } from './decorators/current-auth-user.decorator'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { LoginDto } from './dto/login.dto'
import { AuthService } from './auth.service'
import type { AuthUser } from './domain/auth-user'

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    /**
     * 登录链路：
     * 1. controller 接收用户名密码
     * 2. 交给 AuthService 校验 demo 账号
     * 3. 返回 accessToken + 当前用户能力摘要
     */
    return this.authService.login(loginDto)
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentAuthUser() authUser: AuthUser) {
    /**
     * /auth/me 不重新查库，而是直接复用 JwtAuthGuard
     * 已经挂到 request.authUser 上的鉴权结果。
     */
    return {
      user: this.authService.serializeUser(authUser),
    }
  }
}

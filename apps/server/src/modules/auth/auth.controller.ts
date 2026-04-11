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

  /**
   * 校验账号并返回访问令牌与角色能力摘要
   * @param loginDto 登录参数
   * @returns 登录结果
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    // 登录流程：接收凭证 -> 交给服务层校验 -> 返回 token 与能力信息。
    return this.authService.login(loginDto)
  }

  /**
   * 返回当前 token 对应的用户上下文
   * @param authUser 当前鉴权用户
   * @returns 用户上下文响应
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@CurrentAuthUser() authUser: AuthUser) {
    // /auth/me 直接复用守卫挂载的鉴权结果，不重复解析 token。
    return {
      user: this.authService.serializeUser(authUser),
    }
  }
}

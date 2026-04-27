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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { ApiEnvelopeResponse } from '../../../../common/swagger/api-envelope-response.decorator'
import { AuthService } from '../../application/services/auth.service'
import { CurrentAuthUser } from '../../decorators/current-auth-user.decorator'
import {
  CurrentUserPayloadDto,
  LoginResultDto,
} from '../../dto/auth-swagger.dto'
import { LoginDto } from '../../dto/login.dto'
import type { AuthUser } from '../../domain/auth-user'
import { JwtAuthGuard } from '../../guards/jwt-auth.guard'

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * 校验账号并返回访问令牌与角色能力摘要
   * @param loginDto 登录参数
   * @returns 登录结果
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '账号密码登录',
    description: '校验用户名密码并返回访问令牌与当前用户能力信息',
  })
  @ApiEnvelopeResponse({
    description: '登录成功',
    type: LoginResultDto,
  })
  @ApiUnauthorizedResponse({
    description: '账号或密码错误',
  })
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
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: '获取当前登录用户',
    description: '校验 Bearer Token 后返回当前用户上下文信息',
  })
  @ApiEnvelopeResponse({
    description: '获取当前用户成功',
    type: CurrentUserPayloadDto,
  })
  @ApiUnauthorizedResponse({
    description: '登录状态已失效或 Token 无效',
  })
  getCurrentUser(@CurrentAuthUser() authUser: AuthUser) {
    // /auth/me 直接复用守卫挂载的鉴权结果，不重复解析 token。
    return {
      user: this.authService.serializeUser(authUser),
    }
  }
}

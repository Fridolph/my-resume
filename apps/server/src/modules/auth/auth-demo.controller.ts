import {
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
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { ApiEnvelopeResponse } from '../../common/swagger/api-envelope-response.decorator'
import { CurrentAuthUser } from './decorators/current-auth-user.decorator'
import { RequireCapability } from './decorators/require-capability.decorator'
import type { AuthUser } from './domain/auth-user'
import { AuthService } from './auth.service'
import { DemoProtectedActionPayloadDto } from './dto/auth-swagger.dto'
import { JwtAuthGuard } from './guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from './guards/role-capabilities.guard'

@Controller('auth/demo')
@UseGuards(JwtAuthGuard)
@ApiTags('Auth Demo')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
  description: '未提供有效 Bearer Token',
})
export class AuthDemoController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('viewer-experience')
  @ApiOperation({
    summary: '获取 viewer 体验示例',
    description: '用于演示已登录用户在只读能力下的返回结构',
  })
  @ApiEnvelopeResponse({
    description: '获取 viewer 体验成功',
    type: DemoProtectedActionPayloadDto,
  })
  getViewerExperience(@CurrentAuthUser() authUser: AuthUser) {
    const user = this.authService.serializeUser(authUser)

    return {
      message: 'viewer read-only experience is available',
      user,
    }
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canPublishResume')
  @ApiOperation({
    summary: '演示发布能力校验',
    description: '仅具备发布权限的角色可通过校验',
  })
  @ApiEnvelopeResponse({
    description: '发布能力校验通过',
    type: DemoProtectedActionPayloadDto,
  })
  @ApiForbiddenResponse({
    description: '当前角色没有发布权限',
  })
  publishResume(@CurrentAuthUser() authUser: AuthUser) {
    return {
      message: 'publish action is available for current role',
      user: this.authService.serializeUser(authUser),
    }
  }

  @Post('ai-analysis')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiOperation({
    summary: '演示 AI 分析能力校验',
    description: '仅具备触发 AI 分析权限的角色可通过校验',
  })
  @ApiEnvelopeResponse({
    description: 'AI 分析能力校验通过',
    type: DemoProtectedActionPayloadDto,
  })
  @ApiForbiddenResponse({
    description: '当前角色没有 AI 分析权限',
  })
  triggerAiAnalysis(@CurrentAuthUser() authUser: AuthUser) {
    return {
      message: 'ai analysis action is available for current role',
      user: this.authService.serializeUser(authUser),
    }
  }
}

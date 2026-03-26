import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentAuthUser } from './decorators/current-auth-user.decorator';
import { RequireCapability } from './decorators/require-capability.decorator';
import type { AuthUser } from './domain/auth-user';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleCapabilitiesGuard } from './guards/role-capabilities.guard';

@Controller('auth/demo')
@UseGuards(JwtAuthGuard)
export class AuthDemoController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Get('viewer-experience')
  getViewerExperience(@CurrentAuthUser() authUser: AuthUser) {
    const user = this.authService.serializeUser(authUser);

    return {
      message: 'viewer read-only experience is available',
      user,
    };
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canPublishResume')
  publishResume(@CurrentAuthUser() authUser: AuthUser) {
    return {
      message: 'publish action is available for current role',
      user: this.authService.serializeUser(authUser),
    };
  }

  @Post('ai-analysis')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  triggerAiAnalysis(@CurrentAuthUser() authUser: AuthUser) {
    return {
      message: 'ai analysis action is available for current role',
      user: this.authService.serializeUser(authUser),
    };
  }
}

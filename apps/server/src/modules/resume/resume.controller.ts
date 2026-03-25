import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { RequireCapability } from '../auth/decorators/require-capability.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleCapabilitiesGuard } from '../auth/guards/role-capabilities.guard';
import { validateStandardResume } from './domain/standard-resume';
import type { StandardResume } from './domain/standard-resume';
import { ResumePublicationService } from './resume-publication.service';

@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumePublicationService: ResumePublicationService,
  ) {}

  @Get('published')
  getPublishedResume() {
    const published = this.resumePublicationService.getPublished();

    if (!published) {
      throw new NotFoundException('Published resume is not available');
    }

    return published;
  }

  @Get('draft')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  getDraftResume() {
    return this.resumePublicationService.getDraft();
  }

  @Put('draft')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  updateDraftResume(@Body() resume: StandardResume) {
    const validationResult = validateStandardResume(resume);

    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.errors);
    }

    return this.resumePublicationService.updateDraft(resume);
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canPublishResume')
  publishResume() {
    return this.resumePublicationService.publish();
  }
}

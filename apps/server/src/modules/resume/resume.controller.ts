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
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';

import { RequireCapability } from '../auth/decorators/require-capability.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RoleCapabilitiesGuard } from '../auth/guards/role-capabilities.guard';
import { ResumeLocale, validateStandardResume } from './domain/standard-resume';
import type { StandardResume } from './domain/standard-resume';
import { ResumeMarkdownExportService } from './resume-markdown-export.service';
import { ResumePdfExportService } from './resume-pdf-export.service';
import { ResumePublicationService } from './resume-publication.service';

@Controller('resume')
export class ResumeController {
  constructor(
    private readonly resumePublicationService: ResumePublicationService,
    private readonly resumeMarkdownExportService: ResumeMarkdownExportService,
    private readonly resumePdfExportService: ResumePdfExportService,
  ) {}

  @Get('published')
  getPublishedResume() {
    const published = this.resumePublicationService.getPublished();

    if (!published) {
      throw new NotFoundException('Published resume is not available');
    }

    return published;
  }

  @Get('published/export/markdown')
  exportPublishedResumeMarkdown(
    @Query('locale') localeQuery: string | undefined,
    @Res() response: Response,
  ) {
    const published = this.resumePublicationService.getPublished();

    if (!published) {
      throw new NotFoundException('Published resume is not available');
    }

    const locale = this.resolveExportLocale(
      localeQuery,
      published.resume.meta.defaultLocale,
    );
    const markdown = this.resumeMarkdownExportService.render(
      published.resume,
      locale,
    );

    response.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${published.resume.meta.slug}-${locale}.md"`,
    );

    response.status(HttpStatus.OK).send(markdown);
  }

  @Get('published/export/pdf')
  async exportPublishedResumePdf(
    @Query('locale') localeQuery: string | undefined,
    @Res() response: Response,
  ) {
    const published = this.resumePublicationService.getPublished();

    if (!published) {
      throw new NotFoundException('Published resume is not available');
    }

    const locale = this.resolveExportLocale(
      localeQuery,
      published.resume.meta.defaultLocale,
    );
    const pdfBuffer = await this.resumePdfExportService.render(
      published.resume,
      locale,
    );

    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${published.resume.meta.slug}-${locale}.pdf"`,
    );

    response.status(HttpStatus.OK).send(pdfBuffer);
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

  private resolveExportLocale(
    locale: string | undefined,
    fallbackLocale: ResumeLocale,
  ): ResumeLocale {
    if (!locale) {
      return fallbackLocale;
    }

    if (locale !== 'zh' && locale !== 'en') {
      throw new BadRequestException(`Unsupported locale: ${locale}`);
    }

    return locale;
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common'
import type { Response } from 'express'

import { RequireCapability } from '../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../auth/guards/role-capabilities.guard'
import { ResumeLocale, validateStandardResume } from './domain/standard-resume'
import type { StandardResume } from './domain/standard-resume'
import { ResumeMarkdownExportService } from './resume-markdown-export.service'
import { ResumePdfExportService } from './resume-pdf-export.service'
import { ResumePublicationService } from './resume-publication.service'
import { buildResumeSummary, resolveResumeSummaryLocale } from './resume-summary'

@Controller('resume')
export class ResumeController {
  constructor(
    @Inject(ResumePublicationService)
    private readonly resumePublicationService: ResumePublicationService,
    @Inject(ResumeMarkdownExportService)
    private readonly resumeMarkdownExportService: ResumeMarkdownExportService,
    @Inject(ResumePdfExportService)
    private readonly resumePdfExportService: ResumePdfExportService,
  ) {}

  @Get('published')
  async getPublishedResume(@Res({ passthrough: true }) response: Response) {
    /**
     * 公开站主读取链路：
     * web 只读 published，不碰 draft。
     */
    const published = await this.resumePublicationService.getPublished()

    if (!published) {
      throw new NotFoundException('Published resume is not available')
    }

    this.applyPublicCacheHeaders(response)

    return published
  }

  @Get('published/summary')
  async getPublishedResumeSummary(
    @Query('locale') localeQuery: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const publishedResume = await this.resumePublicationService.getPublished()

    if (!publishedResume) {
      throw new NotFoundException('Published resume is not available')
    }

    const { locale, queryInvalid } = resolveResumeSummaryLocale({
      localeQuery,
      cookieHeader,
      fallbackLocale: publishedResume.resume.meta.defaultLocale,
    })

    if (queryInvalid) {
      throw new BadRequestException(`Unsupported locale: ${localeQuery}`)
    }

    this.applyPublicCacheHeaders(response, true)

    return {
      status: publishedResume.status,
      publishedAt: publishedResume.publishedAt,
      resume: buildResumeSummary(publishedResume.resume, locale),
    }
  }

  @Get('published/export/markdown')
  async exportPublishedResumeMarkdown(
    @Query('locale') localeQuery: string | undefined,
    @Res() response: Response,
  ) {
    const published = await this.resumePublicationService.getPublished()

    if (!published) {
      throw new NotFoundException('Published resume is not available')
    }

    const locale = this.resolveExportLocale(
      localeQuery,
      published.resume.meta.defaultLocale,
    )
    const markdown = this.resumeMarkdownExportService.render(published.resume, locale)

    response.setHeader('Content-Type', 'text/markdown; charset=utf-8')
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${published.resume.meta.slug}-${locale}.md"`,
    )
    this.applyPublicCacheHeaders(response, true)

    response.status(HttpStatus.OK).send(markdown)
  }

  @Get('published/export/pdf')
  async exportPublishedResumePdf(
    @Query('locale') localeQuery: string | undefined,
    @Res() response: Response,
  ) {
    const published = await this.resumePublicationService.getPublished()

    if (!published) {
      throw new NotFoundException('Published resume is not available')
    }

    const locale = this.resolveExportLocale(
      localeQuery,
      published.resume.meta.defaultLocale,
    )
    const pdfBuffer = await this.resumePdfExportService.render(published.resume, locale)

    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${published.resume.meta.slug}-${locale}.pdf"`,
    )
    this.applyPublicCacheHeaders(response, true)

    response.status(HttpStatus.OK).send(pdfBuffer)
  }

  @Get('draft')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async getDraftResume(@Res({ passthrough: true }) response: Response) {
    /**
     * 后台编辑链路从 draft 开始：
     * admin 拿到的是可编辑草稿，不是公开快照。
     */
    this.applyPrivateNoStoreHeaders(response)
    return this.resumePublicationService.getDraft()
  }

  @Get('draft/summary')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async getDraftResumeSummary(
    @Query('locale') localeQuery: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const draft = await this.resumePublicationService.getDraft()
    const { locale, queryInvalid } = resolveResumeSummaryLocale({
      localeQuery,
      cookieHeader,
      fallbackLocale: draft.resume.meta.defaultLocale,
    })

    if (queryInvalid) {
      throw new BadRequestException(`Unsupported locale: ${localeQuery}`)
    }

    this.applyPrivateNoStoreHeaders(response)

    return {
      status: draft.status,
      updatedAt: draft.updatedAt,
      resume: buildResumeSummary(draft.resume, locale),
    }
  }

  @Put('draft')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async updateDraftResume(@Body() resume: StandardResume) {
    /**
     * 保存草稿前先做结构校验，避免非法 JSON 直接落库。
     */
    const validationResult = validateStandardResume(resume)

    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.errors)
    }

    return this.resumePublicationService.updateDraft(resume)
  }

  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canPublishResume')
  async publishResume() {
    /**
     * publish 并不是“把 draft 改状态”，
     * 而是基于当前 draft 生成一份新的 published snapshot。
     */
    return this.resumePublicationService.publish()
  }

  private resolveExportLocale(
    locale: string | undefined,
    fallbackLocale: ResumeLocale,
  ): ResumeLocale {
    if (!locale) {
      return fallbackLocale
    }

    if (locale !== 'zh' && locale !== 'en') {
      throw new BadRequestException(`Unsupported locale: ${locale}`)
    }

    return locale
  }

  private applyPublicCacheHeaders(response: Response, varyByCookie = false) {
    response.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
    response.setHeader(
      'Vary',
      varyByCookie ? 'Cookie, Accept-Encoding' : 'Accept-Encoding',
    )
  }

  private applyPrivateNoStoreHeaders(response: Response) {
    response.setHeader(
      'Cache-Control',
      'private, no-store, no-cache, max-age=0, must-revalidate',
    )
    response.setHeader('Pragma', 'no-cache')
    response.setHeader('Vary', 'Authorization, Cookie')
  }
}

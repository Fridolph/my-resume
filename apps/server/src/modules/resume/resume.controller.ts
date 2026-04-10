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
import type {
  ResumeDraftSnapshotResponse,
  ResumeDraftSummarySnapshotResponse,
  ResumePublishedSnapshotResponse,
  ResumePublishedSummarySnapshotResponse,
} from './transport/types/resume-response.types'

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

  /**
   * 返回公开站使用的最新发布快照
   * @param response 响应对象
   * @returns 发布态快照
   */
  @Get('published')
  async getPublishedResume(
    @Res({ passthrough: true }) response: Response,
  ): Promise<ResumePublishedSnapshotResponse> {
    // 公开站只读取发布态快照，不直接读取草稿。
    const published = await this.resumePublicationService.getPublished()

    if (!published) {
      throw new NotFoundException('Published resume is not available')
    }

    this.applyPublicCacheHeaders(response)

    return published
  }

  /**
   * 返回发布态摘要供公开页轻量渲染使用
   * @param localeQuery 查询参数 locale
   * @param cookieHeader 请求 cookie
   * @param response 响应对象
   * @returns 发布态摘要快照
   */
  @Get('published/summary')
  async getPublishedResumeSummary(
    @Query('locale') localeQuery: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ResumePublishedSummarySnapshotResponse> {
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

  /**
   * 导出当前发布态 Markdown
   * @param localeQuery 查询参数 locale
   * @param response 响应对象
   * @returns Promise<void>
   */
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

  /**
   * 导出当前发布态 PDF
   * @param localeQuery 查询参数 locale
   * @param response 响应对象
   * @returns Promise<void>
   */
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

  /**
   * 返回后台编辑使用的草稿快照
   * @param response 响应对象
   * @returns 草稿快照
   */
  @Get('draft')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async getDraftResume(
    @Res({ passthrough: true }) response: Response,
  ): Promise<ResumeDraftSnapshotResponse> {
    // 后台编辑链路从 draft 开始，避免直接改动公开站内容。
    this.applyPrivateNoStoreHeaders(response)
    return this.resumePublicationService.getDraft()
  }

  /**
   * 返回草稿摘要供后台概览与导航使用
   * @param localeQuery 查询参数 locale
   * @param cookieHeader 请求 cookie
   * @param response 响应对象
   * @returns 草稿摘要快照
   */
  @Get('draft/summary')
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async getDraftResumeSummary(
    @Query('locale') localeQuery: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ResumeDraftSummarySnapshotResponse> {
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

  /**
   * 校验并保存当前草稿
   * @param resume 草稿内容
   * @returns 保存后的草稿快照
   */
  @Put('draft')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  async updateDraftResume(
    @Body() resume: StandardResume,
  ): Promise<ResumeDraftSnapshotResponse> {
    // 保存草稿前先做结构校验，避免非法 JSON 直接落库。
    const validationResult = validateStandardResume(resume)

    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.errors)
    }

    return this.resumePublicationService.updateDraft(resume)
  }

  /**
   * 基于当前草稿生成新的发布快照
   * @returns 发布态快照
   */
  @Post('publish')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RoleCapabilitiesGuard)
  @RequireCapability('canPublishResume')
  async publishResume(): Promise<ResumePublishedSnapshotResponse> {
    // publish 不是改状态位，而是从 draft 追加一条新的发布快照。
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

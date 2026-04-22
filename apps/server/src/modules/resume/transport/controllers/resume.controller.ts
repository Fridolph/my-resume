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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Response } from 'express'

import { SkipResponseEnvelope } from '../../../../common/decorators/skip-response-envelope.decorator'
import { ApiEnvelopeResponse } from '../../../../common/swagger/api-envelope-response.decorator'
import {
  ResumeMarkdownExportService,
} from '../../application/services/resume-markdown-export.service'
import { ResumePdfExportService } from '../../application/services/resume-pdf-export.service'
import { ResumePublicationService } from '../../application/services/resume-publication.service'
import { buildResumeSummary, resolveResumeSummaryLocale } from '../../application/services/resume-summary'
import { ResumeLocale, validateStandardResume } from '../../domain/standard-resume'
import type { StandardResume } from '../../domain/standard-resume'
import { RequireCapability } from '../../../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../../../auth/guards/role-capabilities.guard'
import type {
  ResumeDraftSnapshotResponse,
  ResumeDraftSummarySnapshotResponse,
  ResumePublishedSnapshotResponse,
  ResumePublishedSummarySnapshotResponse,
} from '../types/resume-response.types'

@Controller('resume')
@ApiTags('Resume')
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
  @ApiOperation({
    summary: '获取发布态简历快照',
    description: '公开站首屏使用的发布态快照读取入口',
  })
  @ApiEnvelopeResponse({
    description: '读取发布态快照成功',
  })
  @ApiNotFoundResponse({
    description: '当前还没有可公开访问的发布快照',
  })
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
  @ApiOperation({
    summary: '获取发布态简历摘要',
    description: '公开页轻量渲染入口，可按 locale 返回摘要内容',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['zh', 'en'],
    description: '摘要输出语言，默认跟随发布态默认语言',
  })
  @ApiEnvelopeResponse({
    description: '读取发布态摘要成功',
  })
  @ApiBadRequestResponse({
    description: 'locale 参数不在支持范围',
  })
  @ApiNotFoundResponse({
    description: '当前还没有可公开访问的发布快照',
  })
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
  @SkipResponseEnvelope()
  @ApiOperation({
    summary: '导出发布态 Markdown',
    description: '下载当前发布态简历的 markdown 文件',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['zh', 'en'],
    description: '导出语言，默认跟随发布态默认语言',
  })
  @ApiProduces('text/markdown')
  @ApiOkResponse({
    description: '导出 markdown 成功',
    schema: {
      type: 'string',
    },
  })
  @ApiBadRequestResponse({
    description: 'locale 参数不在支持范围',
  })
  @ApiNotFoundResponse({
    description: '当前还没有可公开访问的发布快照',
  })
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
    this.applyExportNoStoreHeaders(response)

    response.status(HttpStatus.OK).send(markdown)
  }

  /**
   * 导出当前发布态 PDF
   * @param localeQuery 查询参数 locale
   * @param response 响应对象
   * @returns Promise<void>
   */
  @Get('published/export/pdf')
  @SkipResponseEnvelope()
  @ApiOperation({
    summary: '导出发布态 PDF',
    description: '下载当前发布态简历的 PDF 文件',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['zh', 'en'],
    description: '导出语言，默认跟随发布态默认语言',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: '导出 PDF 成功',
    content: {
      'application/pdf': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'locale 参数不在支持范围',
  })
  @ApiNotFoundResponse({
    description: '当前还没有可公开访问的发布快照',
  })
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
    this.applyExportNoStoreHeaders(response)

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
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: '获取草稿态简历快照',
    description: '后台编辑页使用的草稿读取入口',
  })
  @ApiEnvelopeResponse({
    description: '读取草稿态快照成功',
  })
  @ApiUnauthorizedResponse({
    description: '未提供有效 Bearer Token',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有编辑简历权限',
  })
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
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: '获取草稿态简历摘要',
    description: '后台导航与概览场景的草稿摘要读取入口',
  })
  @ApiQuery({
    name: 'locale',
    required: false,
    enum: ['zh', 'en'],
    description: '摘要输出语言，默认跟随草稿默认语言',
  })
  @ApiEnvelopeResponse({
    description: '读取草稿态摘要成功',
  })
  @ApiBadRequestResponse({
    description: 'locale 参数不在支持范围',
  })
  @ApiUnauthorizedResponse({
    description: '未提供有效 Bearer Token',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有编辑简历权限',
  })
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
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: '保存草稿态简历',
    description: '后台编辑保存入口，会先做结构校验再写入数据库',
  })
  @ApiEnvelopeResponse({
    description: '保存草稿成功',
  })
  @ApiBadRequestResponse({
    description: '简历结构校验失败',
  })
  @ApiUnauthorizedResponse({
    description: '未提供有效 Bearer Token',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有编辑简历权限',
  })
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
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: '发布当前草稿',
    description: '基于草稿生成新的发布快照',
  })
  @ApiEnvelopeResponse({
    description: '发布成功',
  })
  @ApiUnauthorizedResponse({
    description: '未提供有效 Bearer Token',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有发布简历权限',
  })
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

  private applyExportNoStoreHeaders(response: Response) {
    response.setHeader('Cache-Control', 'no-store, no-cache, max-age=0, must-revalidate')
    response.setHeader('Pragma', 'no-cache')
    response.setHeader('Expires', '0')
    response.setHeader('Vary', 'Accept-Encoding')
  }
}

import { Body, Controller, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common'
import type { UserSession } from '@repo/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { updateTranslationSchema } from './translations.schema.js'
import { TranslationsService } from './translations.service.js'

@Controller('admin/translations')
export class TranslationsController {
  constructor(@Inject(TranslationsService) private readonly translationsService: TranslationsService) {}

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('translation.read')
  @Get()
  async listTranslations() {
    return await this.translationsService.listTranslations()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('translation.read')
  @Get(':translationId/versions')
  async listTranslationVersions(@Param('translationId') translationId: string) {
    return await this.translationsService.listTranslationVersions(translationId)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('translation.write')
  @Put(':translationId')
  async updateTranslation(@Param('translationId') translationId: string, @Body() body: unknown, @CurrentUser() currentUser: UserSession) {
    const parsed = updateTranslationSchema.parse(body)
    return await this.translationsService.updateTranslation(translationId, parsed, currentUser)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('translation.write')
  @Post(':translationId/versions/:versionId/restore')
  async restoreTranslationVersion(@Param('translationId') translationId: string, @Param('versionId') versionId: string, @CurrentUser() currentUser: UserSession) {
    return await this.translationsService.restoreTranslationVersion(translationId, versionId, currentUser)
  }
}

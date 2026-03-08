import { Body, Controller, Get, Inject, Param, Put, UseGuards } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { updateTranslationSchema } from './translations.schema.js'
import { TranslationsService } from './translations.service.js'

@Controller('translations')
export class TranslationsController {
  constructor(@Inject(TranslationsService) private readonly translationsService: TranslationsService) {}

  @Public()
  @Get()
  async listTranslations() {
    return await this.translationsService.listTranslations()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('translation.write')
  @Put(':translationId')
  async updateTranslation(@Param('translationId') translationId: string, @Body() body: unknown) {
    const parsed = updateTranslationSchema.parse(body)
    return await this.translationsService.updateTranslation(translationId, parsed)
  }
}

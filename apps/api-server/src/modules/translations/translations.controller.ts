import { Body, Controller, Get, Inject, Param, Put } from '@nestjs/common'
import { updateTranslationSchema } from './translations.schema.js'
import { TranslationsService } from './translations.service.js'

@Controller('translations')
export class TranslationsController {
  constructor(@Inject(TranslationsService) private readonly translationsService: TranslationsService) {}

  @Get()
  async listTranslations() {
    return await this.translationsService.listTranslations()
  }

  @Put(':translationId')
  async updateTranslation(@Param('translationId') translationId: string, @Body() body: unknown) {
    const parsed = updateTranslationSchema.parse(body)
    return await this.translationsService.updateTranslation(translationId, parsed)
  }
}

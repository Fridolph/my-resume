import { Controller, Get, Inject, Query } from '@nestjs/common'
import type { WebLocale } from '@repo/types'
import { Public } from '../../common/decorators/public.decorator.js'
import { TranslationsService } from './translations.service.js'

@Controller('public/translations')
export class TranslationsPublicController {
  constructor(@Inject(TranslationsService) private readonly translationsService: TranslationsService) {}

  @Public()
  @Get()
  async listTranslations(@Query('locale') locale?: WebLocale) {
    const records = await this.translationsService.listTranslations()

    return records.filter(record => {
      const matchesLocale = locale ? record.locale === locale : true
      return record.status === 'published' && !record.missing && matchesLocale
    })
  }
}

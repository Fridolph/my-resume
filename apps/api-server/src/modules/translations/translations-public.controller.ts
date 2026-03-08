import { Controller, Get, Inject, Query } from '@nestjs/common'
import type { WebLocale } from '@repo/types'
import { Public } from '../../common/decorators/public.decorator.js'
import { ReleasesService } from '../releases/releases.service.js'

@Controller('public/translations')
export class TranslationsPublicController {
  constructor(@Inject(ReleasesService) private readonly releasesService: ReleasesService) {}

  @Public()
  @Get()
  async listTranslations(@Query('locale') locale?: WebLocale) {
    const snapshot = await this.releasesService.getActivePublicReleaseSnapshot()

    return snapshot.translations.filter(record => {
      const matchesLocale = locale ? record.locale === locale : true
      return matchesLocale && !record.missing
    })
  }
}

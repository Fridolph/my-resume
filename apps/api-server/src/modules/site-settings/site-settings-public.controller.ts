import { Controller, Get, Inject } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { SiteSettingsService } from './site-settings.service.js'

@Controller('public/site-settings')
export class SiteSettingsPublicController {
  constructor(@Inject(SiteSettingsService) private readonly siteSettingsService: SiteSettingsService) {}

  @Public()
  @Get()
  async getSiteSettings() {
    return await this.siteSettingsService.getSiteSettings()
  }
}

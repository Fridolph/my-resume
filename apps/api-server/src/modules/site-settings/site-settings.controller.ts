import { Body, Controller, Get, Inject, Put } from '@nestjs/common'
import type { SiteSettingsRecord } from '@repo/types'
import { siteSettingsSchema } from './site-settings.schema.js'
import { SiteSettingsService } from './site-settings.service.js'

@Controller('site-settings')
export class SiteSettingsController {
  constructor(@Inject(SiteSettingsService) private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  async getSiteSettings() {
    return await this.siteSettingsService.getSiteSettings()
  }

  @Put()
  async updateSiteSettings(@Body() body: unknown) {
    const parsed = siteSettingsSchema.parse(body) as SiteSettingsRecord
    return await this.siteSettingsService.updateSiteSettings(parsed)
  }
}

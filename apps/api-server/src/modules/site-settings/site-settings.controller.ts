import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import type { SiteSettingsRecord } from '@repo/types'
import { siteSettingsSchema } from './site-settings.schema.js'
import { SiteSettingsService } from './site-settings.service.js'

@Controller('site-settings')
export class SiteSettingsController {
  constructor(@Inject(SiteSettingsService) private readonly siteSettingsService: SiteSettingsService) {}

  @Public()
  @Get()
  async getSiteSettings() {
    return await this.siteSettingsService.getSiteSettings()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('site.write')
  @Put()
  async updateSiteSettings(@Body() body: unknown) {
    const parsed = siteSettingsSchema.parse(body) as SiteSettingsRecord
    return await this.siteSettingsService.updateSiteSettings(parsed)
  }
}

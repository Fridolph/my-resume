import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { SiteSettingsController } from './site-settings.controller.js'
import { SiteSettingsPublicController } from './site-settings-public.controller.js'
import { SiteSettingsService } from './site-settings.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [SiteSettingsController, SiteSettingsPublicController],
  providers: [SiteSettingsService]
})
export class SiteSettingsModule {}

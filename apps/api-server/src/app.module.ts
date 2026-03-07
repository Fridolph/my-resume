import { Module } from '@nestjs/common'
import { DatabaseModule } from './modules/database/database.module.js'
import { HealthModule } from './modules/health/health.module.js'
import { SiteSettingsModule } from './modules/site-settings/site-settings.module.js'
import { UsersModule } from './modules/users/users.module.js'

@Module({
  imports: [DatabaseModule, HealthModule, SiteSettingsModule, UsersModule]
})
export class AppModule {}

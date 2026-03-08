import { Module } from '@nestjs/common'
import { DatabaseModule } from './modules/database/database.module.js'
import { HealthModule } from './modules/health/health.module.js'
import { SiteSettingsModule } from './modules/site-settings/site-settings.module.js'
import { UsersModule } from './modules/users/users.module.js'
import { TranslationsModule } from './modules/translations/translations.module.js'
import { ResumeModule } from './modules/resume/resume.module.js'
import { ProjectsModule } from './modules/projects/projects.module.js'
import { AuthModule } from './modules/auth/auth.module.js'
import { ReleasesModule } from './modules/releases/releases.module.js'

@Module({
  imports: [DatabaseModule, HealthModule, SiteSettingsModule, UsersModule, TranslationsModule, ResumeModule, ProjectsModule, AuthModule, ReleasesModule]
})
export class AppModule {}

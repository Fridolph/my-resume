import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { ReleasesModule } from '../releases/releases.module.js'
import { TranslationsController } from './translations.controller.js'
import { TranslationsPublicController } from './translations-public.controller.js'
import { TranslationsService } from './translations.service.js'

@Module({
  imports: [DatabaseModule, ReleasesModule],
  controllers: [TranslationsController, TranslationsPublicController],
  providers: [TranslationsService]
})
export class TranslationsModule {}

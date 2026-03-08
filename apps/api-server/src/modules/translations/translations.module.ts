import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { TranslationsController } from './translations.controller.js'
import { TranslationsPublicController } from './translations-public.controller.js'
import { TranslationsService } from './translations.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [TranslationsController, TranslationsPublicController],
  providers: [TranslationsService]
})
export class TranslationsModule {}

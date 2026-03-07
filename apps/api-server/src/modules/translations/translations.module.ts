import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { TranslationsController } from './translations.controller.js'
import { TranslationsService } from './translations.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [TranslationsController],
  providers: [TranslationsService]
})
export class TranslationsModule {}

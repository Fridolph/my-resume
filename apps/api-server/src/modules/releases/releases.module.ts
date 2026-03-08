import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { ReleasesController } from './releases.controller.js'
import { ReleasesPublicController } from './releases-public.controller.js'
import { ReleasesService } from './releases.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [ReleasesController, ReleasesPublicController],
  providers: [ReleasesService],
  exports: [ReleasesService]
})
export class ReleasesModule {}

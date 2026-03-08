import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { ReleasesModule } from '../releases/releases.module.js'
import { ResumeController } from './resume.controller.js'
import { ResumePublicController } from './resume-public.controller.js'
import { ResumeService } from './resume.service.js'

@Module({
  imports: [DatabaseModule, ReleasesModule],
  controllers: [ResumeController, ResumePublicController],
  providers: [ResumeService]
})
export class ResumeModule {}

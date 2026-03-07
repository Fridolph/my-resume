import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/database.module.js'
import { ResumeController } from './resume.controller.js'
import { ResumeService } from './resume.service.js'

@Module({
  imports: [DatabaseModule],
  controllers: [ResumeController],
  providers: [ResumeService]
})
export class ResumeModule {}

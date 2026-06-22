import { Module } from '@nestjs/common'
import { ResumeAssistantController } from './resume-assistant.controller'
import { ResumeAssistantService } from './resume-assistant.service'

@Module({
  controllers: [ResumeAssistantController],
  providers: [ResumeAssistantService],
})
export class ResumeAssistantModule {}

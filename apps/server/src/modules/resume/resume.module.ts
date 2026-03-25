import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ResumeController } from './resume.controller';
import { ResumePublicationService } from './resume-publication.service';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [ResumePublicationService],
  exports: [ResumePublicationService],
})
export class ResumeModule {}

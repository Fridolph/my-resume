import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ResumeController } from './resume.controller';
import { ResumeMarkdownExportService } from './resume-markdown-export.service';
import { ResumePdfExportService } from './resume-pdf-export.service';
import { ResumePublicationRepository } from './resume-publication.repository';
import { ResumePublicationService } from './resume-publication.service';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [
    ResumePublicationRepository,
    ResumePublicationService,
    ResumeMarkdownExportService,
    ResumePdfExportService,
  ],
  exports: [
    ResumePublicationRepository,
    ResumePublicationService,
    ResumeMarkdownExportService,
    ResumePdfExportService,
  ],
})
export class ResumeModule {}

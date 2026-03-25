import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { ResumeController } from './resume.controller';
import { ResumeMarkdownExportService } from './resume-markdown-export.service';
import { ResumePdfExportService } from './resume-pdf-export.service';
import { ResumePublicationService } from './resume-publication.service';

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [
    ResumePublicationService,
    ResumeMarkdownExportService,
    ResumePdfExportService,
  ],
  exports: [
    ResumePublicationService,
    ResumeMarkdownExportService,
    ResumePdfExportService,
  ],
})
export class ResumeModule {}

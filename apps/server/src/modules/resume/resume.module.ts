import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { RagRetrievalRepository } from '../ai/rag/rag-retrieval.repository'
import { ResumeController } from './resume.controller'
import { ResumeMarkdownExportService } from './resume-markdown-export.service'
import { ResumePdfExportService } from './resume-pdf-export.service'
import { ResumePublicationRepository } from './resume-publication.repository'
import { ResumePublicationService } from './resume-publication.service'
import { ResumeRagSyncService } from './resume-rag-sync.service'

@Module({
  imports: [AuthModule],
  controllers: [ResumeController],
  providers: [
    ResumePublicationRepository,
    ResumePublicationService,
    ResumeRagSyncService,
    RagRetrievalRepository,
    ResumeMarkdownExportService,
    ResumePdfExportService,
  ],
  exports: [
    ResumePublicationRepository,
    ResumePublicationService,
    ResumeRagSyncService,
    ResumeMarkdownExportService,
    ResumePdfExportService,
  ],
})
export class ResumeModule {}

import { Module } from '@nestjs/common'

import { AuthModule } from '../auth/auth.module'
import { RagRetrievalRepository } from '../ai/rag/rag-retrieval.repository'
import { ResumeMarkdownExportService } from './application/services/resume-markdown-export.service'
import { ResumePdfExportService } from './application/services/resume-pdf-export.service'
import { ResumePublicationService } from './application/services/resume-publication.service'
import { ResumeRagSyncService } from './application/services/resume-rag-sync.service'
import { ResumePublicationRepository } from './infrastructure/repositories/resume-publication.repository'
import { ResumeController } from './transport/controllers/resume.controller'

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

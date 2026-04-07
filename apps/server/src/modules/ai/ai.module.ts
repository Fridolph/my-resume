import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResumeModule } from '../resume/resume.module';
import { AiFileController } from './ai-file.controller';
import { AiReportController } from './ai-report.controller';
import { AnalysisReportCacheService } from './analysis-report-cache.service';
import { resolveAiRuntimeConfig } from './config/ai-config';
import { AiResumeOptimizationService } from './ai-resume-optimization.service';
import { AiService } from './ai.service';
import { FileExtractionService } from './file-extraction.service';
import { AI_FETCH, AI_PROVIDER_INSTANCE, AI_RUNTIME_CONFIG } from './ai.tokens';
import { createAiProvider } from './providers/ai-provider.factory';
import { RagController } from './rag/rag.controller';
import { RagChunkService } from './rag/rag-chunk.service';
import { RagIndexRepository } from './rag/rag-index.repository';
import { RagKnowledgeService } from './rag/rag-knowledge.service';
import { RagService } from './rag/rag.service';

@Module({
  imports: [AuthModule, ResumeModule],
  controllers: [AiFileController, AiReportController, RagController],
  providers: [
    {
      provide: AI_RUNTIME_CONFIG,
      useFactory: () => resolveAiRuntimeConfig(process.env),
    },
    {
      provide: AI_FETCH,
      useValue: fetch,
    },
    {
      provide: AI_PROVIDER_INSTANCE,
      inject: [AI_RUNTIME_CONFIG, AI_FETCH],
      useFactory: createAiProvider,
    },
    AiService,
    AiResumeOptimizationService,
    AnalysisReportCacheService,
    FileExtractionService,
    RagChunkService,
    RagKnowledgeService,
    RagIndexRepository,
    RagService,
  ],
  exports: [
    AiService,
    AiResumeOptimizationService,
    AnalysisReportCacheService,
    FileExtractionService,
    RagService,
  ],
})
export class AiModule {}

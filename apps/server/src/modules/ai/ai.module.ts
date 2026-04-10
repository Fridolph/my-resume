import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ResumeModule } from '../resume/resume.module'
import { AiFileController } from './ai-file.controller'
import { AiReportController } from './ai-report.controller'
import { AnalysisReportCacheService } from './analysis-report-cache.service'
import { resolveAiRuntimeConfig } from './config/ai-config'
import { AiResumeOptimizationService } from './ai-resume-optimization.service'
import { AiService } from './ai.service'
import { FileExtractionService } from './file-extraction.service'
import { AI_FETCH, AI_PROVIDER_INSTANCE, AI_RUNTIME_CONFIG } from './ai.tokens'
import { createAiProvider } from './providers/ai-provider.factory'
import { RagController } from './rag/rag.controller'
import { RagChunkService } from './rag/rag-chunk.service'
import { RagIndexRepository } from './rag/rag-index.repository'
import { RagKnowledgeService } from './rag/rag-knowledge.service'
import { RagService } from './rag/rag.service'

@Module({
  imports: [AuthModule, ResumeModule],
  controllers: [AiFileController, AiReportController, RagController],
  providers: [
    {
      /**
       * AI 配置先统一收口，再决定 provider 实例。
       * 这样 mock / deepseek / openai-compatible 的切换不会影响上层业务。
       */
      provide: AI_RUNTIME_CONFIG,
      useFactory: () => resolveAiRuntimeConfig(process.env),
    },
    {
      provide: AI_FETCH,
      useValue: fetch,
    },
    {
      /**
       * 真正对上层暴露的是统一 AiProvider 接口，
       * controller / service 不直接感知底层厂商差异。
       */
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

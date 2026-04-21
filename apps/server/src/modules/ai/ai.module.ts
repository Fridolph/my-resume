import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ResumeModule } from '../resume/resume.module'
import { AiFileController } from './ai-file.controller'
import { AiUsageRecordRepository } from './ai-usage-record.repository'
import { AiUsageRecordService } from './ai-usage-record.service'
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
import { RagRetrievalRepository } from './rag/rag-retrieval.repository'
import { RagService } from './rag/rag.service'
import { ResumeOptimizationResultCacheService } from './resume-optimization-result-cache.service'

@Module({
  imports: [AuthModule, ResumeModule],
  controllers: [AiFileController, AiReportController, RagController],
  providers: [
    {
      // 先解析统一 AI 运行时配置，再根据配置创建 provider。
      provide: AI_RUNTIME_CONFIG,
      useFactory: () => resolveAiRuntimeConfig(process.env),
    },
    {
      provide: AI_FETCH,
      useValue: fetch,
    },
    {
      // 对上层只暴露统一 AiProvider 接口，屏蔽厂商差异。
      provide: AI_PROVIDER_INSTANCE,
      inject: [AI_RUNTIME_CONFIG, AI_FETCH],
      useFactory: createAiProvider,
    },
    AiService,
    AiUsageRecordRepository,
    AiUsageRecordService,
    AiResumeOptimizationService,
    AnalysisReportCacheService,
    ResumeOptimizationResultCacheService,
    FileExtractionService,
    RagChunkService,
    RagKnowledgeService,
    RagIndexRepository,
    RagRetrievalRepository,
    RagService,
  ],
  exports: [
    AiService,
    AiUsageRecordService,
    AiResumeOptimizationService,
    AnalysisReportCacheService,
    ResumeOptimizationResultCacheService,
    FileExtractionService,
    RagService,
  ],
})
export class AiModule {}

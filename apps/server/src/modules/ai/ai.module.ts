import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { ResumeModule } from '../resume/resume.module'
import { AnalysisReportCacheService } from './application/services/analysis-report-cache.service'
import { AiResumeOptimizationService } from './application/services/ai-resume-optimization.service'
import { AiService } from './application/services/ai.service'
import { AiUsageRecordService } from './application/services/ai-usage-record.service'
import { FileExtractionService } from './application/services/file-extraction.service'
import { ResumeImportRecognitionService } from './application/services/resume-import-recognition.service'
import { ResumeOptimizationResultCacheService } from './application/services/resume-optimization-result-cache.service'
import { AiChatBootstrapService } from './chat/ai-chat-bootstrap.service'
import { AiChatGraphService } from './chat/ai-chat-graph.service'
import { AiChatRepository } from './chat/ai-chat.repository'
import { AiChatService } from './chat/ai-chat.service'
import { AI_FETCH, AI_PROVIDER_INSTANCE, AI_RUNTIME_CONFIG } from './ai.tokens'
import { resolveAiRuntimeConfig } from './infrastructure/config/ai-config'
import { createAiProvider } from './infrastructure/providers/ai-provider.factory'
import { AiUsageRecordRepository } from './infrastructure/repositories/ai-usage-record.repository'
import { AiChatController } from './transport/controllers/ai-chat.controller'
import { RagController } from './rag/rag.controller'
import { RagChunkService } from './rag/rag-chunk.service'
import { RagIndexRepository } from './rag/rag-index.repository'
import { RagKnowledgeService } from './rag/rag-knowledge.service'
import { RagRetrievalRepository } from './rag/rag-retrieval.repository'
import { RagService } from './rag/rag.service'
import { resolveRagVectorStoreRuntimeConfig } from './rag/vector-store/config'
import { createRagVectorStore } from './rag/vector-store/factory'
import {
  RAG_VECTOR_STORE,
  RAG_VECTOR_STORE_CONFIG,
} from './rag/vector-store/tokens'
import { UserDocsIngestionService } from './rag/user-docs-ingestion.service'
import { AiFileController } from './transport/controllers/ai-file.controller'
import { AiReportController } from './transport/controllers/ai-report.controller'
import { AiResumeImportController } from './transport/controllers/ai-resume-import.controller'

@Module({
  imports: [AuthModule, ResumeModule],
  controllers: [
    AiFileController,
    AiReportController,
    AiResumeImportController,
    AiChatController,
    RagController,
  ],
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
      // RAG 向量存储后端配置，默认 local（不改变当前主链路）。
      provide: RAG_VECTOR_STORE_CONFIG,
      useFactory: () => resolveRagVectorStoreRuntimeConfig(process.env),
    },
    {
      // 通过工厂按环境变量切换 local / milvus(mock) 实现。
      provide: RAG_VECTOR_STORE,
      inject: [RAG_VECTOR_STORE_CONFIG],
      useFactory: createRagVectorStore,
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
    AiChatRepository,
    AiChatBootstrapService,
    AiChatGraphService,
    AiChatService,
    AiResumeOptimizationService,
    AnalysisReportCacheService,
    ResumeOptimizationResultCacheService,
    ResumeImportRecognitionService,
    FileExtractionService,
    RagChunkService,
    RagKnowledgeService,
    RagIndexRepository,
    RagRetrievalRepository,
    UserDocsIngestionService,
    RagService,
  ],
  exports: [
    AiService,
    AiUsageRecordService,
    AiChatService,
    AiResumeOptimizationService,
    AnalysisReportCacheService,
    ResumeOptimizationResultCacheService,
    ResumeImportRecognitionService,
    FileExtractionService,
    RagService,
  ],
})
export class AiModule {}

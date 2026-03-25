import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AiFileController } from './ai-file.controller';
import { resolveAiRuntimeConfig } from './config/ai-config';
import { AiService } from './ai.service';
import { FileExtractionService } from './file-extraction.service';
import { AI_FETCH, AI_PROVIDER_INSTANCE, AI_RUNTIME_CONFIG } from './ai.tokens';
import { createAiProvider } from './providers/ai-provider.factory';

@Module({
  imports: [AuthModule],
  controllers: [AiFileController],
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
    FileExtractionService,
  ],
  exports: [AiService, FileExtractionService],
})
export class AiModule {}

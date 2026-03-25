import { Module } from '@nestjs/common';

import { resolveAiRuntimeConfig } from './config/ai-config';
import { AiService } from './ai.service';
import { AI_FETCH, AI_PROVIDER_INSTANCE, AI_RUNTIME_CONFIG } from './ai.tokens';
import { createAiProvider } from './providers/ai-provider.factory';

@Module({
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
  ],
  exports: [AiService],
})
export class AiModule {}

import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'

import { AiChatRepository } from './ai-chat.repository'

@Injectable()
export class AiChatBootstrapService implements OnModuleInit {
  private readonly logger = new Logger(AiChatBootstrapService.name)

  constructor(
    @Inject(AiChatRepository)
    private readonly aiChatRepository: AiChatRepository,
  ) {}

  async onModuleInit() {
    await this.aiChatRepository.ensureTables()
    this.logger.log('ai chat tables ensured')
  }
}

import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common'

import { RequireCapability } from '../../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../../auth/guards/role-capabilities.guard'
import { RagService } from './rag.service'

interface RagSearchBody {
  query: string
  limit?: number
}

interface RagAskBody {
  question: string
  limit?: number
  locale?: 'zh' | 'en'
}

@Controller('ai/rag')
@UseGuards(JwtAuthGuard)
export class RagController {
  constructor(
    @Inject(RagService)
    private readonly ragService: RagService,
  ) {}

  @Get('status')
  getStatus() {
    return this.ragService.getStatus()
  }

  @Post('index/rebuild')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  rebuildIndex() {
    /**
     * rebuild 是 RAG 的“建索引入口”：
     * 把结构化简历源和博客源重新切块、向量化并写回本地索引文件。
     */
    return this.ragService.rebuildIndex()
  }

  @Post('search')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  search(@Body() body: RagSearchBody) {
    return this.ragService.search(body.query, body.limit)
  }

  @Post('ask')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  ask(@Body() body: RagAskBody) {
    /**
     * ask 不是直接问大模型，
     * 而是先 search，再把 top-N chunk 拼成上下文后调用生成接口。
     */
    return this.ragService.ask(body.question, body.limit, body.locale)
  }
}

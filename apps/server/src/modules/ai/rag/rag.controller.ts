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

  /**
   * 返回 RAG 索引状态与运行时摘要
   * @returns RAG 状态
   */
  @Get('status')
  getStatus() {
    return this.ragService.getStatus()
  }

  /**
   * 重建简历与知识库的向量索引
   * @returns 重建后的状态摘要
   */
  @Post('index/rebuild')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  rebuildIndex() {
    // 建索引入口：重切块、重向量化，并写回本地索引文件。
    return this.ragService.rebuildIndex()
  }

  /**
   * 在当前索引上执行语义检索
   * @param body 检索请求体
   * @returns 检索结果列表
   */
  @Post('search')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  search(@Body() body: RagSearchBody) {
    return this.ragService.search(body.query, body.limit)
  }

  /**
   * 基于检索上下文生成问答结果
   * @param body 问答请求体
   * @returns 问答结果
   */
  @Post('ask')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  ask(@Body() body: RagAskBody) {
    // ask 先 search，再拼接上下文调用生成接口，不是直接裸问模型。
    return this.ragService.ask(body.question, body.limit, body.locale)
  }
}

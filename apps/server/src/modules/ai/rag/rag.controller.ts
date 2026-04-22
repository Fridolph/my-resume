import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { ApiEnvelopeResponse } from '../../../common/swagger/api-envelope-response.decorator'
import { RequireCapability } from '../../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../../auth/guards/role-capabilities.guard'
import { ResumeRagSyncService } from '../../resume/resume-rag-sync.service'
import {
  RagAskBodyDto,
  RagAskResultDto,
  RagResumeSyncBodyDto,
  RagResumeSyncResultDto,
  RagSearchBodyDto,
  RagSearchMatchDto,
  RagStatusDto,
} from './dto/rag-swagger.dto'
import { RagService } from './rag.service'

@Controller('ai/rag')
@UseGuards(JwtAuthGuard)
@ApiTags('AI RAG')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
  description: '未提供有效 Bearer Token',
})
export class RagController {
  constructor(
    @Inject(RagService)
    private readonly ragService: RagService,
    @Inject(ResumeRagSyncService)
    private readonly resumeRagSyncService: ResumeRagSyncService,
  ) {}

  /**
   * 返回 RAG 索引状态与运行时摘要
   * @returns RAG 状态
   */
  @Get('status')
  @ApiOperation({
    summary: '获取 RAG 索引状态',
    description: '返回索引存在性、是否过期与关键摘要信息',
  })
  @ApiEnvelopeResponse({
    description: '读取 RAG 状态成功',
    type: RagStatusDto,
  })
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
  @ApiOperation({
    summary: '重建 RAG 索引',
    description: '重建简历与知识库向量索引',
  })
  @ApiEnvelopeResponse({
    description: '重建 RAG 索引成功',
    type: RagStatusDto,
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  rebuildIndex() {
    // 建索引入口：重切块、重向量化，并写回本地索引文件。
    return this.ragService.rebuildIndex()
  }

  /**
   * 人工触发简历检索态同步。
   *
   * @param body 同步范围
   * @returns 同步摘要
   */
  @Post('sync/resume')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiOperation({
    summary: '人工触发简历检索态同步',
    description: '按 scope 同步 draft/published 到检索态表',
  })
  @ApiEnvelopeResponse({
    description: '简历检索态同步成功',
    type: RagResumeSyncResultDto,
  })
  @ApiBadRequestResponse({
    description: '同步参数不合法',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  syncResumeRetrieval(@Body() body: RagResumeSyncBodyDto = {}) {
    const scope = body.scope ?? 'all'

    if (scope !== 'draft' && scope !== 'published' && scope !== 'all') {
      throw new BadRequestException(`Unsupported sync scope: ${scope}`)
    }

    return this.resumeRagSyncService.syncCurrent(scope)
  }

  /**
   * 在当前索引上执行语义检索
   * @param body 检索请求体
   * @returns 检索结果列表
   */
  @Post('search')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiOperation({
    summary: '执行 RAG 检索',
    description: '在当前索引中按语义与关键词执行混合检索',
  })
  @ApiEnvelopeResponse({
    description: '检索成功',
    isArray: true,
    type: RagSearchMatchDto,
  })
  @ApiBadRequestResponse({
    description: '检索参数不合法',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  search(@Body() body: RagSearchBodyDto) {
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
  @ApiOperation({
    summary: '执行 RAG 问答',
    description: '先检索上下文，再基于上下文生成回答',
  })
  @ApiEnvelopeResponse({
    description: '问答成功',
    type: RagAskResultDto,
  })
  @ApiBadRequestResponse({
    description: '问答参数不合法',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  ask(@Body() body: RagAskBodyDto) {
    // ask 先 search，再拼接上下文调用生成接口，不是直接裸问模型。
    return this.ragService.ask(body.question, body.limit, body.locale)
  }
}

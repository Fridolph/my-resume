import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
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
  RagUserDocIngestBodyDto,
  RagUserDocIngestResultDto,
} from './dto/rag-swagger.dto'
import { RagService } from './rag.service'
import { UserDocsIngestionService } from './user-docs-ingestion.service'

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
    @Inject(UserDocsIngestionService)
    private readonly userDocsIngestionService: UserDocsIngestionService,
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
   * 上传并写入 user_docs 检索态（仅 draft/published）。
   *
   * @param file 上传文件
   * @param body 入库参数
   * @returns 入库结果摘要
   */
  @Post('ingest/user-doc')
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '上传并入库 user_docs',
    description: '提取文件文本后切块向量化，并写入 user_docs 检索态表',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: {
        file: {
          description: '待入库的用户资料文件',
          format: 'binary',
          type: 'string',
        },
        scope: {
          description: '入库作用域（仅 draft/published）',
          enum: ['draft', 'published'],
          type: 'string',
        },
        chunkingProfile: {
          description: '切片策略（balanced=500/50，contextual=1000/100）',
          enum: ['balanced', 'contextual'],
          type: 'string',
        },
      },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiEnvelopeResponse({
    description: 'user_docs 入库成功',
    type: RagUserDocIngestResultDto,
  })
  @ApiBadRequestResponse({
    description: '文件缺失或入库参数不合法',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  ingestUserDoc(
    @UploadedFile() file?: Express.Multer.File,
    @Body() body: RagUserDocIngestBodyDto = {},
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    const sourceScope = body.scope ?? 'draft'

    if (sourceScope !== 'draft' && sourceScope !== 'published') {
      throw new BadRequestException(`Unsupported ingest scope: ${sourceScope}`)
    }

    if (
      body.chunkingProfile &&
      body.chunkingProfile !== 'balanced' &&
      body.chunkingProfile !== 'contextual'
    ) {
      throw new BadRequestException(
        `Unsupported ingest chunkingProfile: ${body.chunkingProfile}`,
      )
    }

    return this.userDocsIngestionService.ingest({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      sourceScope,
      chunkingProfile: body.chunkingProfile,
    })
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
    if (
      body.vectorScope &&
      body.vectorScope !== 'draft' &&
      body.vectorScope !== 'published' &&
      body.vectorScope !== 'all'
    ) {
      throw new BadRequestException(`Unsupported search vectorScope: ${body.vectorScope}`)
    }

    return this.ragService.search(body.query, body.limit, {
      minScore: body.minScore,
      minScoreGap: body.minScoreGap,
    }, {
      useVectorStore: body.useVectorStore,
      vectorScope: body.vectorScope,
      fallbackToLocal: body.vectorFallbackToLocal,
    })
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
    if (
      body.vectorScope &&
      body.vectorScope !== 'draft' &&
      body.vectorScope !== 'published' &&
      body.vectorScope !== 'all'
    ) {
      throw new BadRequestException(`Unsupported ask vectorScope: ${body.vectorScope}`)
    }

    // ask 先 search，再拼接上下文调用生成接口，不是直接裸问模型。
    return this.ragService.ask(body.question, body.limit, body.locale, {
      useVectorStore: body.useVectorStore,
      vectorScope: body.vectorScope,
      fallbackToLocal: body.vectorFallbackToLocal,
    })
  }
}

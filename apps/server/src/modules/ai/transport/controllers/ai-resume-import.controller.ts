import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import type { Response } from 'express'

import { SkipResponseEnvelope } from '../../../../common/decorators/skip-response-envelope.decorator'
import { ApiEnvelopeResponse } from '../../../../common/swagger/api-envelope-response.decorator'
import type { RequestWithTraceId } from '../../../../common/http/trace-id'
import { RequireCapability } from '../../../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../../../auth/guards/role-capabilities.guard'
import { ResumeImportRecognitionService } from '../../application/services/resume-import-recognition.service'
import {
  ApplyResumeImportBodyDto,
  ResumeImportJobDto,
  ResumeImportResultDto,
} from '../dto/resume-import-swagger.dto'

export const RESUME_IMPORT_UPLOAD_MAX_BYTES = 1024 * 1024
const RESUME_IMPORT_PROGRESS_HINTS = [
  '正在梳理教育经历',
  '正在提取工作经历',
  '正在识别核心项目',
  '正在核对技能关键词',
  '正在生成输入治理报告',
  '正在校验候选草稿结构',
]

function randomProgressHintDelayMs() {
  return 8000 + Math.floor(Math.random() * 5000)
}

@Controller('ai/resume-import')
@UseGuards(JwtAuthGuard)
@ApiTags('AI Resume Import')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
  description: '未提供有效 Bearer Token',
})
export class AiResumeImportController {
  constructor(
    @Inject(ResumeImportRecognitionService)
    private readonly resumeImportRecognitionService: ResumeImportRecognitionService,
  ) {}

  @Post('recognize')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: RESUME_IMPORT_UPLOAD_MAX_BYTES,
      },
    }),
  )
  @ApiOperation({
    summary: '识别上传简历为候选草稿',
    description:
      '第一版仅支持中文 md/txt。接口返回 202 表示异步任务已创建；扩展名、文本长度、AI 生成和 schema 校验等内容类错误会通过 GET /api/ai/resume-import/jobs/:jobId 的 failed 状态返回。识别结果只进入临时结果缓存，不直接覆盖草稿或发布态。',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: {
        file: {
          description: '中文 Markdown/TXT 简历文件，第一版不超过 1MB',
          format: 'binary',
          type: 'string',
        },
      },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiEnvelopeResponse({
    description: '简历导入识别任务已启动',
    type: ResumeImportJobDto,
  })
  @ApiBadRequestResponse({
    description:
      '请求层错误，例如文件缺失或超过 1MB 上传限制；内容识别错误请查看 job 状态',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  recognize(
    @UploadedFile() file?: Express.Multer.File,
    @Req() request?: RequestWithTraceId,
  ) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    return this.resumeImportRecognitionService.recognize({
      buffer: file.buffer,
      originalname: file.originalname,
      traceId: request?.traceId,
      mimetype: file.mimetype,
      size: file.size,
    })
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: '获取简历导入识别任务状态',
    description: '按 jobId 读取当前识别阶段、步骤时间线、失败详情与完成后的 resultId。',
  })
  @ApiParam({
    name: 'jobId',
    description: '识别任务 ID',
    example: 'job-123456',
  })
  @ApiEnvelopeResponse({
    description: '读取简历导入识别任务成功',
    type: ResumeImportJobDto,
  })
  @ApiNotFoundResponse({
    description: '识别任务不存在或已过期',
  })
  getJob(@Param('jobId') jobId: string) {
    return this.resumeImportRecognitionService.getJob(jobId)
  }

  @Get('jobs/:jobId/events')
  @SkipResponseEnvelope()
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @ApiOperation({
    summary: '订阅简历导入识别任务事件',
    description:
      '通过 text/event-stream 推送 job.snapshot / job.completed / job.failed / job.heartbeat。该接口不走统一响应 envelope。',
  })
  @ApiParam({
    name: 'jobId',
    description: '识别任务 ID',
    example: 'job-123456',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  @ApiNotFoundResponse({
    description: '识别任务不存在或已过期',
  })
  streamJobEvents(@Param('jobId') jobId: string, @Res() response: Response) {
    const initialJob = this.resumeImportRecognitionService.getJob(jobId)
    let closed = false
    let unsubscribe: (() => void) | undefined
    let heartbeatTimer: NodeJS.Timeout | undefined
    let progressHintTimer: NodeJS.Timeout | undefined
    let progressHintIndex = 0

    const writeEvent = (event: string, payload: unknown) => {
      if (closed || response.writableEnded) {
        return
      }

      response.write(`event: ${event}\n`)
      response.write(`data: ${JSON.stringify(payload)}\n\n`)
    }

    const closeStream = () => {
      if (closed) {
        return
      }

      closed = true
      unsubscribe?.()

      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
      }

      if (progressHintTimer) {
        clearTimeout(progressHintTimer)
      }
    }

    response.status(HttpStatus.OK)
    response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    response.setHeader('Cache-Control', 'no-cache, no-transform')
    response.setHeader('Connection', 'keep-alive')
    response.flushHeaders?.()

    const initialEvent =
      initialJob.status === 'completed'
        ? 'job.completed'
        : initialJob.status === 'failed'
          ? 'job.failed'
          : 'job.snapshot'

    writeEvent(initialEvent, initialJob)

    if (initialJob.status !== 'running') {
      closeStream()
      response.end()
      return
    }

    unsubscribe = this.resumeImportRecognitionService.subscribeToJob(
      jobId,
      (event, job) => {
        writeEvent(event, job)

        if (event === 'job.completed' || event === 'job.failed') {
          closeStream()
          response.end()
        }
      },
    )
    heartbeatTimer = setInterval(() => {
      writeEvent('job.heartbeat', {
        jobId,
        timestamp: new Date().toISOString(),
      })
    }, 15_000)

    const scheduleProgressHint = () => {
      progressHintTimer = setTimeout(() => {
        if (closed) {
          return
        }

        const job = this.resumeImportRecognitionService.getJob(jobId)

        if (job.status === 'running' && job.currentStage === 'ai_generating') {
          const message =
            RESUME_IMPORT_PROGRESS_HINTS[
              progressHintIndex % RESUME_IMPORT_PROGRESS_HINTS.length
            ] ?? '正在生成候选草稿'
          progressHintIndex += 1
          writeEvent('job.progress_hint', {
            jobId,
            message,
            timestamp: new Date().toISOString(),
          })
        }

        if (!closed && job.status === 'running') {
          scheduleProgressHint()
        }
      }, randomProgressHintDelayMs())
    }

    scheduleProgressHint()
    response.on('close', closeStream)
  }

  @Get('results/:resultId')
  @ApiOperation({
    summary: '获取简历导入识别结果',
    description: '按 resultId 读取候选草稿摘要、模块 diff 与 warnings。',
  })
  @ApiParam({
    name: 'resultId',
    description: '识别结果 ID',
    example: 'result-123456',
  })
  @ApiEnvelopeResponse({
    description: '读取简历导入识别结果成功',
    type: ResumeImportResultDto,
  })
  @ApiNotFoundResponse({
    description: '识别结果不存在或已过期',
  })
  async getResult(@Param('resultId') resultId: string) {
    return this.resumeImportRecognitionService.getResult(resultId)
  }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  @ApiOperation({
    summary: '按模块回填候选草稿',
    description:
      '只把用户选择的模块写回当前 draft；发布态仍需用户手动发布。MVP 中同一个 resultId 只允许成功回填一次。',
  })
  @ApiEnvelopeResponse({
    description: '简历导入结果回填成功',
  })
  @ApiBadRequestResponse({
    description: '模块选择无效或没有实际变化',
  })
  @ApiConflictResponse({
    description: '草稿已更新，需要重新上传识别',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有编辑简历权限',
  })
  @ApiNotFoundResponse({
    description: '识别结果不存在或已过期',
  })
  apply(@Body() body: ApplyResumeImportBodyDto) {
    return this.resumeImportRecognitionService.apply(body)
  }
}

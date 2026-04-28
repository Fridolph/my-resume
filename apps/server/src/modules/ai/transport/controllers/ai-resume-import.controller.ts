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

import { ApiEnvelopeResponse } from '../../../../common/swagger/api-envelope-response.decorator'
import { RequireCapability } from '../../../auth/decorators/require-capability.decorator'
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard'
import { RoleCapabilitiesGuard } from '../../../auth/guards/role-capabilities.guard'
import { ResumeImportRecognitionService } from '../../application/services/resume-import-recognition.service'
import {
  ApplyResumeImportBodyDto,
  ResumeImportResultDto,
} from '../dto/resume-import-swagger.dto'

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
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canTriggerAiAnalysis')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '识别上传简历为候选草稿',
    description:
      '第一版仅支持中文 md/txt。识别结果只进入临时结果缓存，不直接覆盖草稿或发布态。',
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
    description: '简历导入识别成功',
    type: ResumeImportResultDto,
  })
  @ApiBadRequestResponse({
    description: '文件缺失、类型不支持、文本过短或过长',
  })
  @ApiForbiddenResponse({
    description: '当前角色没有触发 AI 分析权限',
  })
  recognize(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    return this.resumeImportRecognitionService.recognize({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    })
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
  getResult(@Param('resultId') resultId: string) {
    return this.resumeImportRecognitionService.getResult(resultId)
  }

  @Post('apply')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RoleCapabilitiesGuard)
  @RequireCapability('canEditResume')
  @ApiOperation({
    summary: '按模块回填候选草稿',
    description: '只把用户选择的模块写回当前 draft；发布态仍需用户手动发布。',
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

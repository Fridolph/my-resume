import {
  BadRequestException,
  Controller,
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
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'

import { ApiEnvelopeResponse } from '../../common/swagger/api-envelope-response.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { FileExtractionResultDto } from './dto/ai-file-swagger.dto'
import { FileExtractionService } from './file-extraction.service'

@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiTags('AI File')
@ApiBearerAuth('bearer')
@ApiUnauthorizedResponse({
  description: '未提供有效 Bearer Token',
})
export class AiFileController {
  constructor(
    @Inject(FileExtractionService)
    private readonly fileExtractionService: FileExtractionService,
  ) {}

  @Post('extract-text')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: '上传文件并提取文本',
    description: '支持 txt / md / pdf / docx，返回归一化文本内容与基础元信息',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: {
        file: {
          description: '待提取文本的文件',
          format: 'binary',
          type: 'string',
        },
      },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiEnvelopeResponse({
    description: '文件提取成功',
    type: FileExtractionResultDto,
  })
  @ApiBadRequestResponse({
    description: '文件缺失、文件类型不支持或提取结果为空',
  })
  async extractText(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required')
    }

    return this.fileExtractionService.extractText({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    })
  }
}

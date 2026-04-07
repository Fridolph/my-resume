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

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { FileExtractionService } from './file-extraction.service'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiFileController {
  constructor(
    @Inject(FileExtractionService)
    private readonly fileExtractionService: FileExtractionService,
  ) {}

  @Post('extract-text')
  @UseInterceptors(FileInterceptor('file'))
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

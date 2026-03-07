import { Body, Controller, Get, Inject, Put } from '@nestjs/common'
import type { ResumeDocument } from '@repo/types'
import { resumeDocumentSchema } from './resume.schema.js'
import { ResumeService } from './resume.service.js'

@Controller('resume')
export class ResumeController {
  constructor(@Inject(ResumeService) private readonly resumeService: ResumeService) {}

  @Get()
  async getResumeDocument() {
    return await this.resumeService.getResumeDocument()
  }

  @Put()
  async updateResumeDocument(@Body() body: unknown) {
    const parsed = resumeDocumentSchema.parse(body) as ResumeDocument
    return await this.resumeService.updateResumeDocument(parsed)
  }
}

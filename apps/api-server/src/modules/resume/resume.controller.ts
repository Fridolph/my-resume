import { Body, Controller, Get, Inject, Put, UseGuards } from '@nestjs/common'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import type { ResumeDocument } from '@repo/types'
import { resumeDocumentSchema } from './resume.schema.js'
import { ResumeService } from './resume.service.js'

@Controller('admin/resume')
export class ResumeController {
  constructor(@Inject(ResumeService) private readonly resumeService: ResumeService) {}

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('resume.read')
  @Get()
  async getResumeDocument() {
    return await this.resumeService.getResumeDocument()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('resume.write')
  @Put()
  async updateResumeDocument(@Body() body: unknown) {
    const parsed = resumeDocumentSchema.parse(body) as ResumeDocument
    return await this.resumeService.updateResumeDocument(parsed)
  }
}

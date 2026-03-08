import { Controller, Get, Inject } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { ResumeService } from './resume.service.js'

@Controller('public/resume')
export class ResumePublicController {
  constructor(@Inject(ResumeService) private readonly resumeService: ResumeService) {}

  @Public()
  @Get()
  async getResumeDocument() {
    return await this.resumeService.getResumeDocument()
  }
}

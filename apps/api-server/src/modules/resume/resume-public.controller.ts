import { Controller, Get, Inject } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { ReleasesService } from '../releases/releases.service.js'

@Controller('public/resume')
export class ResumePublicController {
  constructor(@Inject(ReleasesService) private readonly releasesService: ReleasesService) {}

  @Public()
  @Get()
  async getResumeDocument() {
    const snapshot = await this.releasesService.getActivePublicReleaseSnapshot()
    return snapshot.resume
  }
}

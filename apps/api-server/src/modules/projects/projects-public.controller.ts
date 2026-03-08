import { Controller, Get, Inject } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { ReleasesService } from '../releases/releases.service.js'

@Controller('public/projects')
export class ProjectsPublicController {
  constructor(@Inject(ReleasesService) private readonly releasesService: ReleasesService) {}

  @Public()
  @Get()
  async listProjects() {
    const snapshot = await this.releasesService.getActivePublicReleaseSnapshot()
    return snapshot.projects
  }
}

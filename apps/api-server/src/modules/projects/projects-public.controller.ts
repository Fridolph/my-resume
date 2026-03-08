import { Controller, Get, Inject } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { ProjectsService } from './projects.service.js'

@Controller('public/projects')
export class ProjectsPublicController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  async listProjects() {
    return await this.projectsService.listProjects()
  }
}

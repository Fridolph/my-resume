import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common'
import { Public } from '../../common/decorators/public.decorator.js'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { createProjectSchema, updateProjectSchema } from './projects.schema.js'
import { ProjectsService } from './projects.service.js'

@Controller('projects')
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  async listProjects() {
    return await this.projectsService.listProjects()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('project.write')
  @Post()
  async createProject(@Body() body: unknown) {
    const parsed = createProjectSchema.parse(body)
    return await this.projectsService.createProject(parsed)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('project.write')
  @Put(':projectId')
  async updateProject(@Param('projectId') projectId: string, @Body() body: unknown) {
    const parsed = updateProjectSchema.parse(body)
    return await this.projectsService.updateProject(projectId, parsed)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('project.write')
  @Delete(':projectId')
  async deleteProject(@Param('projectId') projectId: string) {
    return await this.projectsService.deleteProject(projectId)
  }
}

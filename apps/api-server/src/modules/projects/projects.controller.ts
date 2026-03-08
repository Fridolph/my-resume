import { Body, Controller, Delete, Get, Inject, Param, Post, Put, UseGuards } from '@nestjs/common'
import type { UserSession } from '@repo/types'
import { CurrentUser } from '../../common/decorators/current-user.decorator.js'
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator.js'
import { ApiAuthGuard } from '../../common/guards/api-auth.guard.js'
import { createProjectSchema, updateProjectSchema } from './projects.schema.js'
import { ProjectsService } from './projects.service.js'

@Controller('admin/projects')
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('project.read')
  @Get()
  async listProjects() {
    return await this.projectsService.listProjects()
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('project.write')
  @Post()
  async createProject(@Body() body: unknown, @CurrentUser() currentUser: UserSession) {
    const parsed = createProjectSchema.parse(body)
    return await this.projectsService.createProject(parsed, currentUser)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('project.write')
  @Put(':projectId')
  async updateProject(@Param('projectId') projectId: string, @Body() body: unknown, @CurrentUser() currentUser: UserSession) {
    const parsed = updateProjectSchema.parse(body)
    return await this.projectsService.updateProject(projectId, parsed, currentUser)
  }

  @UseGuards(ApiAuthGuard)
  @RequirePermissions('project.write')
  @Delete(':projectId')
  async deleteProject(@Param('projectId') projectId: string) {
    return await this.projectsService.deleteProject(projectId)
  }
}

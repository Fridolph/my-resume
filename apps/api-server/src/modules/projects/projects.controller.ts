import { Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common'
import { createProjectSchema, updateProjectSchema } from './projects.schema.js'
import { ProjectsService } from './projects.service.js'

@Controller('projects')
export class ProjectsController {
  constructor(@Inject(ProjectsService) private readonly projectsService: ProjectsService) {}

  @Get()
  async listProjects() {
    return await this.projectsService.listProjects()
  }

  @Post()
  async createProject(@Body() body: unknown) {
    const parsed = createProjectSchema.parse(body)
    return await this.projectsService.createProject(parsed)
  }

  @Put(':projectId')
  async updateProject(@Param('projectId') projectId: string, @Body() body: unknown) {
    const parsed = updateProjectSchema.parse(body)
    return await this.projectsService.updateProject(projectId, parsed)
  }

  @Delete(':projectId')
  async deleteProject(@Param('projectId') projectId: string) {
    return await this.projectsService.deleteProject(projectId)
  }
}

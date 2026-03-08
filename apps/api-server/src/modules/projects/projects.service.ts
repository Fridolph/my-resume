import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { createProject, deleteProject, listProjects, updateProject } from '@repo/database'
import { canTransitionPublishStatus, publishStatusLabels, type ProjectRecord } from '@repo/types'

@Injectable()
export class ProjectsService {
  async listProjects() {
    return await listProjects()
  }

  async createProject(record: Omit<ProjectRecord, 'updatedAt' | 'id'>) {
    return await createProject({
      id: `project_${crypto.randomUUID()}`,
      ...record
    })
  }

  async updateProject(projectId: string, record: Omit<ProjectRecord, 'updatedAt' | 'id'>) {
    const currentProject = (await listProjects()).find(project => project.id === projectId)

    if (!currentProject) {
      throw new NotFoundException(`Project ${projectId} not found`)
    }

    if (!canTransitionPublishStatus(currentProject.status, record.status)) {
      throw new BadRequestException({
        code: 'INVALID_PUBLISH_STATUS_TRANSITION',
        message: `项目状态不允许从 ${publishStatusLabels[currentProject.status]} 直接流转到 ${publishStatusLabels[record.status]}。`
      })
    }

    return await updateProject(projectId, record)
  }

  async deleteProject(projectId: string) {
    await deleteProject(projectId)
    return { success: true }
  }
}

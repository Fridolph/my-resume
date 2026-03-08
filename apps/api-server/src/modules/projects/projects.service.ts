import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { createProject, deleteProject, listContentVersions, listProjects, updateProject } from '@repo/database'
import { canTransitionPublishStatus, publishStatusLabels, type ProjectRecord, type ProjectVersionRecord, type UserSession } from '@repo/types'

@Injectable()
export class ProjectsService {
  async listProjects() {
    return await listProjects()
  }

  async listProjectVersions(projectId: string) {
    return await listContentVersions('project', projectId) as ProjectVersionRecord[]
  }

  async createProject(record: Omit<ProjectRecord, 'updatedAt' | 'id' | 'updatedBy' | 'reviewedBy' | 'publishedAt'>, currentUser: UserSession) {
    return await createProject({
      id: `project_${crypto.randomUUID()}`,
      ...record
    }, currentUser)
  }

  async updateProject(projectId: string, record: Omit<ProjectRecord, 'updatedAt' | 'id' | 'updatedBy' | 'reviewedBy' | 'publishedAt'>, currentUser: UserSession) {
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

    return await updateProject(projectId, record, currentUser)
  }

  async deleteProject(projectId: string) {
    await deleteProject(projectId)
    return { success: true }
  }
}

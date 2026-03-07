import { Injectable } from '@nestjs/common'
import { createProject, deleteProject, listProjects, updateProject } from '@repo/database'
import type { ProjectRecord } from '@repo/types'

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
    return await updateProject(projectId, record)
  }

  async deleteProject(projectId: string) {
    await deleteProject(projectId)
    return { success: true }
  }
}

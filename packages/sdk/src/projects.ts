import type { ProjectRecord, ProjectVersionRecord } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { requestApi } from './site-settings.js'
import { createResumeApiClient } from './resume.js'

export interface CreateProjectInput {
  slug: string
  status: ProjectRecord['status']
  sortOrder: number
  cover: string
  externalUrl: string
  tags: string[]
  locales: ProjectRecord['locales']
}

export interface UpdateProjectInput extends CreateProjectInput {}

export function createProjectsApiClient(options: PlatformApiClientOptions) {
  const baseClient = createResumeApiClient(options)

  return {
    ...baseClient,
    async listProjects() {
      return await requestApi<ProjectRecord[]>('projects', undefined, options)
    },
    async createProject(input: CreateProjectInput) {
      return await requestApi<ProjectRecord>('projects', {
        method: 'POST',
        body: JSON.stringify(input)
      }, options)
    },
    async listProjectVersions(projectId: string) {
      return await requestApi<ProjectVersionRecord[]>(`projects/${projectId}/versions`, undefined, options)
    },
    async updateProject(projectId: string, input: UpdateProjectInput) {
      return await requestApi<ProjectRecord>(`projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
      }, options)
    },
    async deleteProject(projectId: string) {
      return await requestApi<{ success: boolean }>(`projects/${projectId}`, {
        method: 'DELETE'
      }, options)
    }
  }
}

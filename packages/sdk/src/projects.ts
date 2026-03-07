import type { ProjectRecord } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
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

  async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
    const fetcher = options.fetcher ?? fetch
    const response = await fetcher(new URL(path, `${options.baseUrl}/`).toString(), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {})
      }
    })

    if (!response.ok) {
      const message = await response.text()
      throw new Error(message || `Request failed with status ${response.status}`)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return await response.json() as T
  }

  return {
    ...baseClient,
    async listProjects() {
      return await requestJson<ProjectRecord[]>('projects')
    },
    async createProject(input: CreateProjectInput) {
      return await requestJson<ProjectRecord>('projects', {
        method: 'POST',
        body: JSON.stringify(input)
      })
    },
    async updateProject(projectId: string, input: UpdateProjectInput) {
      return await requestJson<ProjectRecord>(`projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
      })
    },
    async deleteProject(projectId: string) {
      return await requestJson<{ success: boolean }>(`projects/${projectId}`, {
        method: 'DELETE'
      })
    }
  }
}

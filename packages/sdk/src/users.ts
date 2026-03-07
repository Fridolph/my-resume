import type { RoleKey, UserRecord, UserStatus } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { createPlatformApiClient } from './site-settings.js'

export interface CreateUserInput {
  name: string
  email: string
  role: RoleKey
  status: UserStatus
}

export interface UpdateUserInput {
  name: string
  email: string
  role: RoleKey
  status: UserStatus
}

export function createUsersApiClient(options: PlatformApiClientOptions) {
  const baseClient = createPlatformApiClient(options)

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

    return await response.json() as T
  }

  return {
    ...baseClient,
    async listUsers() {
      return await requestJson<UserRecord[]>('users')
    },
    async createUser(input: CreateUserInput) {
      return await requestJson<UserRecord>('users', {
        method: 'POST',
        body: JSON.stringify(input)
      })
    },
    async updateUser(userId: string, input: UpdateUserInput) {
      return await requestJson<UserRecord>(`users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
      })
    }
  }
}

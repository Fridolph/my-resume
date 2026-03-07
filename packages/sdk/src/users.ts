import type { RoleKey, UserRecord, UserStatus } from '@repo/types'
import type { PlatformApiClientOptions } from './site-settings.js'
import { createPlatformApiClient, requestApi } from './site-settings.js'

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

  return {
    ...baseClient,
    async listUsers() {
      return await requestApi<UserRecord[]>('users', undefined, options)
    },
    async createUser(input: CreateUserInput) {
      return await requestApi<UserRecord>('users', {
        method: 'POST',
        body: JSON.stringify(input)
      }, options)
    },
    async updateUser(userId: string, input: UpdateUserInput) {
      return await requestApi<UserRecord>(`users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(input)
      }, options)
    }
  }
}

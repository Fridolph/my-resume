import { Injectable } from '@nestjs/common'
import { createUser, listUsers, updateUser } from '@repo/database'
import type { UserRecord } from '@repo/types'

@Injectable()
export class UsersService {
  async listUsers() {
    return await listUsers()
  }

  async createUser(record: Omit<UserRecord, 'permissions' | 'updatedAt' | 'id'>) {
    return await createUser({
      id: `user_${crypto.randomUUID()}`,
      ...record
    })
  }

  async updateUser(userId: string, record: Omit<UserRecord, 'permissions' | 'updatedAt' | 'id'>) {
    return await updateUser(userId, {
      id: userId,
      ...record
    })
  }
}

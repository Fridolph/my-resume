import { Inject, Injectable } from '@nestjs/common'
import { eq } from 'drizzle-orm'

import type { DatabaseClient, DatabaseInstance } from '../../../../database/database.client'
import { DATABASE_CLIENT, DATABASE_INSTANCE } from '../../../../database/database.tokens'
import { users } from '../../../../database/schema'
import { UserRole } from '../../domain/user-role.enum'

export interface CreateAuthUserInput {
  id: string
  username: string
  passwordHash: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type AuthUserRecord = typeof users.$inferSelect

@Injectable()
export class AuthUserRepository {
  constructor(
    @Inject(DATABASE_INSTANCE)
    private readonly database: DatabaseInstance,
    @Inject(DATABASE_CLIENT)
    private readonly databaseClient: DatabaseClient,
  ) {}

  /**
   * 为历史数据库补齐 users 表与关键索引。
   *
   * 说明：
   * - 项目此前登录鉴权不依赖 users 表。
   * - 这里在服务启动时做最小兜底，避免旧库上线时直接报 “no such table: users”。
   */
  async ensureUsersTable() {
    await this.databaseClient.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY NOT NULL,
        username text NOT NULL,
        password_hash text NOT NULL,
        role text NOT NULL,
        is_active integer NOT NULL DEFAULT 1,
        last_login_at integer,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      );
    `)

    await this.databaseClient.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique
      ON users (username);
    `)

    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS users_role_is_active_idx
      ON users (role, is_active);
    `)

    await this.databaseClient.execute(`
      CREATE INDEX IF NOT EXISTS users_created_at_idx
      ON users (created_at);
    `)
  }

  async findById(id: string) {
    const [record] = await this.database.select().from(users).where(eq(users.id, id)).limit(1)

    return record ?? null
  }

  async findByUsername(username: string) {
    const [record] = await this.database
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    return record ?? null
  }

  async createUser(input: CreateAuthUserInput) {
    await this.database
      .insert(users)
      .values({
        id: input.id,
        username: input.username,
        passwordHash: input.passwordHash,
        role: input.role,
        isActive: input.isActive,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt,
      })
      .onConflictDoNothing({
        target: users.username,
      })

    return await this.findByUsername(input.username)
  }

  async updateLastLoginAt(id: string, loginTime = new Date()) {
    await this.database
      .update(users)
      .set({
        lastLoginAt: loginTime,
        updatedAt: loginTime,
      })
      .where(eq(users.id, id))
  }
}

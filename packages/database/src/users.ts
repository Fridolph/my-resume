import { getRolePermissions } from '@repo/types'
import type { RoleKey, UserRecord, UserStatus } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './client.js'
import type { UserInsert, UserRow } from './schema/index.js'
import { users } from './schema/index.js'

function createUserRecord(input: {
  id: string
  name: string
  email: string
  role: RoleKey
  status: UserStatus
}): UserRecord {
  return {
    ...input,
    permissions: getRolePermissions(input.role),
    updatedAt: new Date().toISOString()
  }
}

const initialUsers: UserRecord[] = [
  createUserRecord({
    id: 'u_super_admin',
    name: 'Fridolph Super Admin',
    email: 'root@fridolph.local',
    role: 'super-admin',
    status: 'active'
  }),
  createUserRecord({
    id: 'u_admin',
    name: 'Fridolph Admin',
    email: 'admin@fridolph.local',
    role: 'admin',
    status: 'active'
  }),
  createUserRecord({
    id: 'u_editor',
    name: 'Fridolph Editor',
    email: 'editor@fridolph.local',
    role: 'editor',
    status: 'active'
  }),
  createUserRecord({
    id: 'u_translator',
    name: 'Fridolph Translator',
    email: 'translator@fridolph.local',
    role: 'translator',
    status: 'disabled'
  }),
  createUserRecord({
    id: 'u_viewer',
    name: 'Fridolph Viewer',
    email: 'viewer@fridolph.local',
    role: 'viewer',
    status: 'active'
  })
]

function fromRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as RoleKey,
    status: row.status as UserStatus,
    permissions: getRolePermissions(row.role as RoleKey),
    updatedAt: row.updatedAt
  }
}

function toRow(record: UserRecord): UserInsert {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    status: record.status,
    permissions: JSON.stringify(getRolePermissions(record.role)),
    updatedAt: record.updatedAt
  }
}

export async function ensureUsersSeed() {
  for (const record of initialUsers) {
    await db.insert(users)
      .values(toRow(record))
      .onConflictDoNothing()
  }
}

export async function listUsers() {
  await ensureUsersSeed()
  const rows = await db.select().from(users).orderBy(asc(users.updatedAt))
  return rows.map(fromRow)
}

export async function createUser(record: Omit<UserRecord, 'permissions' | 'updatedAt'>) {
  const nextRecord = createUserRecord(record)
  await db.insert(users).values(toRow(nextRecord))
  return nextRecord
}

export async function updateUser(userId: string, record: Omit<UserRecord, 'permissions' | 'updatedAt'>) {
  const nextRecord = createUserRecord({ ...record, id: userId })

  await db.update(users)
    .set(toRow(nextRecord))
    .where(eq(users.id, userId))

  return nextRecord
}

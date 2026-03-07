import type { PermissionKey, RoleKey, UserRecord, UserStatus } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './client.js'
import type { UserInsert, UserRow } from './schema/index.js'
import { users } from './schema/index.js'

const rolePermissions: Record<RoleKey, PermissionKey[]> = {
  admin: [
    'dashboard.read',
    'user.read',
    'user.write',
    'translation.read',
    'translation.write',
    'resume.read',
    'resume.write',
    'project.read',
    'project.write',
    'site.write'
  ],
  editor: [
    'dashboard.read',
    'translation.read',
    'resume.read',
    'resume.write',
    'project.read',
    'project.write'
  ],
  translator: [
    'dashboard.read',
    'translation.read',
    'translation.write'
  ]
}

function createUserRecord(input: {
  id: string
  name: string
  email: string
  role: RoleKey
  status: UserStatus
}): UserRecord {
  return {
    ...input,
    permissions: rolePermissions[input.role],
    updatedAt: new Date().toISOString()
  }
}

const initialUsers: UserRecord[] = [
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
  })
]

function fromRow(row: UserRow): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as RoleKey,
    status: row.status as UserStatus,
    permissions: JSON.parse(row.permissions),
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
    permissions: JSON.stringify(rolePermissions[record.role]),
    updatedAt: record.updatedAt
  }
}

export async function ensureUsersSeed() {
  const existing = await db.select({ id: users.id }).from(users).limit(1)

  if (existing.length === 0) {
    await db.insert(users).values(initialUsers.map(toRow))
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

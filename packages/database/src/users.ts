import { getRolePermissions } from '@repo/types'
import type { RoleKey, UserRecord, UserStatus } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { hashPassword } from './auth-crypto.js'
import { db } from './client.js'
import type { UserInsert, UserRow } from './schema/index.js'
import { users } from './schema/index.js'

interface UserRowWithPassword extends UserRow {
  passwordHash: string
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
    permissions: getRolePermissions(input.role),
    updatedAt: new Date().toISOString()
  }
}

function createSeedUser(input: {
  id: string
  name: string
  email: string
  role: RoleKey
  status: UserStatus
  password: string
}) {
  const record = createUserRecord({
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    status: input.status
  })

  return {
    record,
    passwordHash: hashPassword(input.email, input.password)
  }
}

const initialUsers = [
  createSeedUser({
    id: 'u_super_admin',
    name: 'Fridolph Super Admin',
    email: 'root@fridolph.local',
    role: 'super-admin',
    status: 'active',
    password: 'root123'
  }),
  createSeedUser({
    id: 'u_admin',
    name: 'Fridolph Admin',
    email: 'admin@fridolph.local',
    role: 'admin',
    status: 'active',
    password: 'admin123'
  }),
  createSeedUser({
    id: 'u_editor',
    name: 'Fridolph Editor',
    email: 'editor@fridolph.local',
    role: 'editor',
    status: 'active',
    password: 'editor123'
  }),
  createSeedUser({
    id: 'u_translator',
    name: 'Fridolph Translator',
    email: 'translator@fridolph.local',
    role: 'translator',
    status: 'active',
    password: 'translator123'
  }),
  createSeedUser({
    id: 'u_viewer',
    name: 'Fridolph Viewer',
    email: 'viewer@fridolph.local',
    role: 'viewer',
    status: 'active',
    password: 'viewer123'
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

function toRow(record: UserRecord, passwordHash: string): UserInsert {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
    status: record.status,
    permissions: JSON.stringify(getRolePermissions(record.role)),
    passwordHash,
    updatedAt: record.updatedAt
  }
}

export async function ensureUsersSeed() {
  for (const user of initialUsers) {
    await db.insert(users)
      .values(toRow(user.record, user.passwordHash))
      .onConflictDoUpdate({
        target: users.id,
        set: toRow(user.record, user.passwordHash)
      })
  }
}

export async function listUsers() {
  await ensureUsersSeed()
  const rows = await db.select().from(users).orderBy(asc(users.updatedAt))
  return rows.map(fromRow)
}

export async function createUser(record: Omit<UserRecord, 'permissions' | 'updatedAt'>) {
  const nextRecord = createUserRecord(record)
  await db.insert(users).values(toRow(nextRecord, hashPassword(record.email, 'change-me-123')))
  return nextRecord
}

export async function updateUser(userId: string, record: Omit<UserRecord, 'permissions' | 'updatedAt'>) {
  const nextRecord = createUserRecord({ ...record, id: userId })
  const existing = await findUserById(userId)
  const passwordHash = existing?.passwordHash ?? hashPassword(record.email, 'change-me-123')

  await db.update(users)
    .set(toRow(nextRecord, passwordHash))
    .where(eq(users.id, userId))

  return nextRecord
}

export async function findUserById(userId: string) {
  await ensureUsersSeed()
  const row = await db.select().from(users).where(eq(users.id, userId)).get() as UserRowWithPassword | undefined

  if (!row) {
    return null
  }

  return {
    record: fromRow(row),
    passwordHash: row.passwordHash
  }
}

export async function findUserByEmail(email: string) {
  await ensureUsersSeed()
  const row = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).get() as UserRowWithPassword | undefined

  if (!row) {
    return null
  }

  return {
    record: fromRow(row),
    passwordHash: row.passwordHash
  }
}

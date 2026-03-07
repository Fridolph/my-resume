import { randomBytes } from 'node:crypto'
import { and, eq, gt, lt } from 'drizzle-orm'
import type { UserRecord } from '@repo/types'
import { db } from './client.js'
import { hashSessionToken, verifyPassword } from './auth-crypto.js'
import { findUserById, findUserByEmail } from './users.js'
import type { AuthSessionInsert } from './schema/index.js'
import { authSessions } from './schema/index.js'

const SESSION_TTL_DAYS = 7

function buildSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

export async function authenticateUser(email: string, password: string) {
  const user = await findUserByEmail(email)

  if (!user || user.record.status !== 'active') {
    return null
  }

  const passwordMatches = verifyPassword(user.record.email, password, user.passwordHash)
  return passwordMatches ? user.record : null
}

export async function createAuthSession(user: UserRecord) {
  const token = randomBytes(32).toString('hex')
  const sessionRecord: AuthSessionInsert = {
    id: `sess_${crypto.randomUUID()}`,
    userId: user.id,
    tokenHash: hashSessionToken(token),
    expiresAt: buildSessionExpiry(),
    createdAt: new Date().toISOString()
  }

  await db.insert(authSessions).values(sessionRecord)

  return {
    token,
    expiresAt: sessionRecord.expiresAt
  }
}

export async function resolveUserBySessionToken(token: string) {
  const now = new Date().toISOString()
  const session = await db.select().from(authSessions).where(and(
    eq(authSessions.tokenHash, hashSessionToken(token)),
    gt(authSessions.expiresAt, now)
  )).get()

  if (!session) {
    return null
  }

  return await findUserById(session.userId)
}

export async function revokeSessionToken(token: string) {
  await db.delete(authSessions)
    .where(eq(authSessions.tokenHash, hashSessionToken(token)))
}

export async function revokeExpiredSessions() {
  const now = new Date().toISOString()
  await db.delete(authSessions)
    .where(lt(authSessions.expiresAt, now))
}

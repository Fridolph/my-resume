import { createHash, scryptSync, timingSafeEqual } from 'node:crypto'

const AUTH_PASSWORD_SALT_PREFIX = 'fridolph-auth'

function buildPasswordSalt(email: string) {
  return `${AUTH_PASSWORD_SALT_PREFIX}:${email.toLowerCase()}`
}

export function hashPassword(email: string, password: string) {
  return scryptSync(password, buildPasswordSalt(email), 64).toString('hex')
}

export function verifyPassword(email: string, password: string, passwordHash: string) {
  const expected = Buffer.from(passwordHash, 'hex')
  const actual = Buffer.from(hashPassword(email, password), 'hex')

  if (expected.length !== actual.length) {
    return false
  }

  return timingSafeEqual(expected, actual)
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

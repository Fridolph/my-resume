import { mkdirSync } from 'fs'
import { dirname, isAbsolute, join, resolve } from 'path'
import { resolveRepoRoot } from '../config/repo-root'

export interface DatabaseRuntimeConfig {
  url: string
  authToken?: string
  isRemote: boolean
  dialect: 'libsql'
}

function firstDefinedValue(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const normalized = value?.trim()

    if (normalized) {
      return normalized
    }
  }

  return undefined
}

export function buildDefaultDatabaseUrl(repoRoot = resolveRepoRoot()): string {
  return `file:${join(repoRoot, '.data', 'my-resume.db')}`
}

function splitFilePathAndSuffix(filePath: string): [pathname: string, suffix: string] {
  const queryIndex = filePath.indexOf('?')

  if (queryIndex === -1) {
    return [filePath, '']
  }

  return [filePath.slice(0, queryIndex), filePath.slice(queryIndex)]
}

function normalizeFileDatabaseUrl(url: string, repoRoot: string): string {
  if (!url.startsWith('file:')) {
    return url
  }

  const filePath = url.slice('file:'.length)
  const [pathname, suffix] = splitFilePathAndSuffix(filePath)

  if (!pathname || pathname.startsWith(':memory:') || suffix.includes('mode=memory')) {
    return url
  }

  if (isAbsolute(pathname)) {
    return url
  }

  return `file:${resolve(repoRoot, pathname)}${suffix}`
}

export function ensureLocalDatabaseDirectory(url: string): void {
  if (!url.startsWith('file:')) {
    return
  }

  const filePath = url.slice('file:'.length)
  const [pathname, suffix] = splitFilePathAndSuffix(filePath)

  if (!pathname || pathname.startsWith(':memory:') || suffix.includes('mode=memory')) {
    return
  }

  mkdirSync(dirname(pathname), {
    recursive: true,
  })
}

export function resolveDatabaseConfig(
  env: NodeJS.ProcessEnv,
  repoRoot = resolveRepoRoot(__dirname),
): DatabaseRuntimeConfig {
  const rawUrl =
    firstDefinedValue(env.DATABASE_URL, env.TURSO_DATABASE_URL, env.LIBSQL_URL) ||
    buildDefaultDatabaseUrl(repoRoot)
  const url = normalizeFileDatabaseUrl(rawUrl, repoRoot)

  const authToken = firstDefinedValue(
    env.DATABASE_AUTH_TOKEN,
    env.TURSO_AUTH_TOKEN,
    env.LIBSQL_AUTH_TOKEN,
  )

  return {
    url,
    authToken,
    isRemote:
      url.startsWith('libsql://') ||
      url.startsWith('https://') ||
      url.startsWith('http://'),
    dialect: 'libsql',
  }
}

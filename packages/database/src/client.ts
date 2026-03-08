import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from './schema/index.js'
import { ensureDirectory, resolveWorkspaceRoot } from './workspace.js'

function resolveDatabasePath() {
  return process.env.REPO_DATABASE_PATH?.trim()
    ? resolve(process.env.REPO_DATABASE_PATH)
    : resolve(resolveWorkspaceRoot(), 'data/platform.sqlite')
}

export const DATABASE_PATH = resolveDatabasePath()
export const MIGRATIONS_PATH = resolve(resolveWorkspaceRoot(), 'packages/database/drizzle')

function createSqliteConnection(databasePath: string) {
  ensureDirectory(databasePath)
  const connection = new DatabaseSync(databasePath)

  connection.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
  `)

  return connection
}

type SqliteConnection = ReturnType<typeof createSqliteConnection>

declare global {
  var __repo_sqlite_connection_map__: Map<string, SqliteConnection> | undefined
}

const sqliteConnectionMap = globalThis.__repo_sqlite_connection_map__ ?? new Map<string, SqliteConnection>()

globalThis.__repo_sqlite_connection_map__ = sqliteConnectionMap

export const sqlite = sqliteConnectionMap.get(DATABASE_PATH) ?? createSqliteConnection(DATABASE_PATH)

if (!sqliteConnectionMap.has(DATABASE_PATH)) {
  sqliteConnectionMap.set(DATABASE_PATH, sqlite)
}

async function sqliteCallback(query: string, params: any[], method: 'run' | 'all' | 'values' | 'get') {
  const statement = sqlite.prepare(query)

  if (method === 'run') {
    statement.run(...params)
    return { rows: [] }
  }

  if (method === 'get') {
    const row = statement.get(...params) as Record<string, unknown> | undefined
    return { rows: row ? Object.values(row) : [] }
  }

  if (method === 'values') {
    const rows = statement.all(...params) as Record<string, unknown>[]
    return { rows: rows.map(row => Object.values(row)) }
  }

  const rows = statement.all(...params) as Record<string, unknown>[]
  return { rows: rows.map(row => Object.values(row)) }
}

export const db = drizzle(sqliteCallback, { schema })

export function closeDatabaseConnection(databasePath = DATABASE_PATH) {
  const connection = sqliteConnectionMap.get(databasePath)

  if (!connection) {
    return
  }

  connection.close()
  sqliteConnectionMap.delete(databasePath)
}

export function getDatabaseHealthSnapshot() {
  return {
    dialect: 'sqlite',
    orm: 'drizzle-orm',
    runtimeDriver: 'node:sqlite',
    databasePath: DATABASE_PATH,
    databaseFileExists: existsSync(DATABASE_PATH)
  }
}

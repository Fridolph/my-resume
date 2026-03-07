import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import * as schema from './schema/index.js'
import { ensureDirectory, resolveWorkspaceRoot } from './workspace.js'

export const DATABASE_PATH = resolve(resolveWorkspaceRoot(), 'data/platform.sqlite')
export const MIGRATIONS_PATH = resolve(resolveWorkspaceRoot(), 'packages/database/drizzle')

function createSqliteConnection() {
  ensureDirectory(DATABASE_PATH)
  const connection = new DatabaseSync(DATABASE_PATH)

  connection.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;
  `)

  return connection
}

type SqliteConnection = ReturnType<typeof createSqliteConnection>

declare global {
  var __repo_sqlite_connection__: SqliteConnection | undefined
}

export const sqlite = globalThis.__repo_sqlite_connection__ ?? createSqliteConnection()

if (!globalThis.__repo_sqlite_connection__) {
  globalThis.__repo_sqlite_connection__ = sqlite
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

export function getDatabaseHealthSnapshot() {
  return {
    dialect: 'sqlite',
    orm: 'drizzle-orm',
    runtimeDriver: 'node:sqlite',
    databasePath: DATABASE_PATH,
    databaseFileExists: existsSync(DATABASE_PATH)
  }
}

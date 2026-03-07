import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

function resolveWorkspaceRoot() {
  let current = process.cwd()

  while (!existsSync(resolve(current, 'pnpm-workspace.yaml'))) {
    const parent = resolve(current, '..')
    if (parent === current) {
      throw new Error('Unable to locate workspace root from current working directory.')
    }
    current = parent
  }

  return current
}

const DATABASE_PATH = resolve(resolveWorkspaceRoot(), 'data/platform.sqlite')

function createDatabase() {
  mkdirSync(dirname(DATABASE_PATH), { recursive: true })
  const sqlite = new DatabaseSync(DATABASE_PATH)

  sqlite.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
  `)

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS site_settings (
      id TEXT PRIMARY KEY NOT NULL,
      default_locale TEXT NOT NULL,
      social_links TEXT NOT NULL,
      download_links TEXT NOT NULL,
      seo TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `)

  return sqlite
}

type DatabaseClient = ReturnType<typeof createDatabase>

declare global {
  var __repo_sqlite__: DatabaseClient | undefined
}

const sqlite = globalThis.__repo_sqlite__ ?? createDatabase()

if (!globalThis.__repo_sqlite__) {
  globalThis.__repo_sqlite__ = sqlite
}

export { DATABASE_PATH, sqlite }

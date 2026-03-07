import { migrate } from 'drizzle-orm/sqlite-proxy/migrator'
import { MIGRATIONS_PATH, db, sqlite } from './client.js'

let migrationPromise: Promise<void> | null = null

export async function migrateDatabase() {
  if (!migrationPromise) {
    migrationPromise = migrate(
      db,
      async (queries) => {
        for (const query of queries) {
          if (query.trim()) {
            sqlite.exec(query)
          }
        }
      },
      { migrationsFolder: MIGRATIONS_PATH }
    )
  }

  await migrationPromise
}

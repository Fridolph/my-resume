import { defineConfig } from 'drizzle-kit'

import {
  buildDefaultDatabaseUrl,
  ensureLocalDatabaseDirectory,
} from './src/database/database.config'

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.TURSO_DATABASE_URL?.trim() ||
  buildDefaultDatabaseUrl()

ensureLocalDatabaseDirectory(databaseUrl)

export default defineConfig({
  out: './drizzle',
  schema: './src/database/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})

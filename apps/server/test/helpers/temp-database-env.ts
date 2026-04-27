import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

interface TempDatabaseEnvContext {
  previousDatabaseUrl?: string
  tempDirectory: string
}

export function assignTempDatabaseUrl(prefix: string): TempDatabaseEnvContext {
  const previousDatabaseUrl = process.env.DATABASE_URL
  const tempDirectory = mkdtempSync(join(tmpdir(), `${prefix}-`))

  process.env.DATABASE_URL = `file:${join(tempDirectory, 'test.db')}`

  return {
    previousDatabaseUrl,
    tempDirectory,
  }
}

export function restoreTempDatabaseUrl(context: TempDatabaseEnvContext) {
  if (context.previousDatabaseUrl) {
    process.env.DATABASE_URL = context.previousDatabaseUrl
  } else {
    delete process.env.DATABASE_URL
  }

  rmSync(context.tempDirectory, {
    force: true,
    recursive: true,
  })
}

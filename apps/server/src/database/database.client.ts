import { Client, createClient } from '@libsql/client'
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql'

import * as schema from './schema'
import { DatabaseRuntimeConfig, ensureLocalDatabaseDirectory } from './database.config'

export type DatabaseClient = Client
export type DatabaseInstance = LibSQLDatabase<typeof schema>

export function createDatabaseClient(config: DatabaseRuntimeConfig): DatabaseClient {
  ensureLocalDatabaseDirectory(config.url)

  return createClient({
    url: config.url,
    authToken: config.authToken,
  })
}

export function createDatabase(client: DatabaseClient): DatabaseInstance {
  return drizzle(client, {
    schema,
  })
}

export async function probeDatabaseConnection(client: DatabaseClient) {
  return client.execute('select 1 as health_check')
}

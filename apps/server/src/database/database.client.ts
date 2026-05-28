import { Client, createClient } from '@libsql/client'
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql'

import * as schema from './schema'
import { DatabaseRuntimeConfig, ensureLocalDatabaseDirectory } from './database.config'

export type DatabaseClient = Client
export type DatabaseInstance = LibSQLDatabase<typeof schema>

export function createDatabaseClient(config: DatabaseRuntimeConfig): DatabaseClient {
  ensureLocalDatabaseDirectory(config.url)

  const client = createClient({
    url: config.url,
    authToken: config.authToken,
  })

  // libsql 默认不开启外键约束，必须显式启用才能让 ON DELETE CASCADE 生效
  client.execute('PRAGMA foreign_keys = ON').catch(() => undefined)

  return client
}

export function createDatabase(client: DatabaseClient): DatabaseInstance {
  return drizzle(client, {
    schema,
  })
}

export async function probeDatabaseConnection(client: DatabaseClient) {
  return client.execute('select 1 as health_check')
}

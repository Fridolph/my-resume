import { createDatabaseClient, probeDatabaseConnection } from './database.client'
import { resolveDatabaseConfig } from './database.config'

async function main() {
  const config = resolveDatabaseConfig(process.env)
  const client = createDatabaseClient(config)
  const result = await probeDatabaseConnection(client)

  console.log(
    `[database] connected via ${config.isRemote ? 'remote libsql' : 'local sqlite'}: ${config.url}`,
  )
  console.log(`[database] probe rows: ${result.rows.length}`)
}

main().catch((error: unknown) => {
  console.error('[database] check failed')
  console.error(error)
  process.exitCode = 1
})

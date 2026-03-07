import { DATABASE_PATH, MIGRATIONS_PATH } from '../client.js'
import { migrateDatabase } from '../migrate.js'

await migrateDatabase()
console.log(`Drizzle migrations applied successfully.`)
console.log(`Database: ${DATABASE_PATH}`)
console.log(`Migrations: ${MIGRATIONS_PATH}`)

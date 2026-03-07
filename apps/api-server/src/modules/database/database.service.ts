import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { DATABASE_PATH, getDatabaseHealthSnapshot, migrateDatabase } from '@repo/database'

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseService.name)

  async onModuleInit() {
    await migrateDatabase()
    this.logger.log(`Database migrations are up to date: ${DATABASE_PATH}`)
  }

  async getHealthSnapshot() {
    return getDatabaseHealthSnapshot()
  }
}

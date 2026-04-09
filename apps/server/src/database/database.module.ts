import { Global, Module } from '@nestjs/common'

import { createDatabase, createDatabaseClient } from './database.client'
import { resolveDatabaseConfig } from './database.config'
import {
  DATABASE_CLIENT,
  DATABASE_INSTANCE,
  DATABASE_RUNTIME_CONFIG,
} from './database.tokens'

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_RUNTIME_CONFIG,
      useFactory: () => resolveDatabaseConfig(process.env),
    },
    {
      provide: DATABASE_CLIENT,
      inject: [DATABASE_RUNTIME_CONFIG],
      useFactory: createDatabaseClient,
    },
    {
      provide: DATABASE_INSTANCE,
      inject: [DATABASE_CLIENT],
      useFactory: createDatabase,
    },
  ],
  exports: [DATABASE_RUNTIME_CONFIG, DATABASE_CLIENT, DATABASE_INSTANCE],
})
export class DatabaseModule {}

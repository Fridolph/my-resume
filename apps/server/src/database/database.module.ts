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
      /**
       * 先把运行时数据库配置解析出来，后面的 client / drizzle
       * 都依赖这份统一配置，避免每个模块自己拼 DATABASE_URL。
       */
      provide: DATABASE_RUNTIME_CONFIG,
      useFactory: () => resolveDatabaseConfig(process.env),
    },
    {
      /**
       * DATABASE_CLIENT 是 libsql 底层 client，
       * 更贴近驱动层。
       */
      provide: DATABASE_CLIENT,
      inject: [DATABASE_RUNTIME_CONFIG],
      useFactory: createDatabaseClient,
    },
    {
      /**
       * DATABASE_INSTANCE 是 Drizzle 包装后的数据库实例，
       * 业务仓储层通常依赖它，而不是直接依赖底层 client。
       */
      provide: DATABASE_INSTANCE,
      inject: [DATABASE_CLIENT],
      useFactory: createDatabase,
    },
  ],
  exports: [DATABASE_RUNTIME_CONFIG, DATABASE_CLIENT, DATABASE_INSTANCE],
})
export class DatabaseModule {}

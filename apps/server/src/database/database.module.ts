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
      // 先解析统一数据库配置，避免每个模块重复处理 DATABASE_URL。
      provide: DATABASE_RUNTIME_CONFIG,
      useFactory: () => resolveDatabaseConfig(process.env),
    },
    {
      // 注入 libsql 底层 client，供更低层能力复用。
      provide: DATABASE_CLIENT,
      inject: [DATABASE_RUNTIME_CONFIG],
      useFactory: createDatabaseClient,
    },
    {
      // 注入 Drizzle 实例，业务仓储层默认依赖它进行读写。
      provide: DATABASE_INSTANCE,
      inject: [DATABASE_CLIENT],
      useFactory: createDatabase,
    },
  ],
  exports: [DATABASE_RUNTIME_CONFIG, DATABASE_CLIENT, DATABASE_INSTANCE],
})
export class DatabaseModule {}

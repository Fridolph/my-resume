import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { buildServerEnvFilePaths } from './config/env-paths'
import { DatabaseModule } from './database/database.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AiModule } from './modules/ai/ai.module'
import { AuthModule } from './modules/auth/auth.module'
import { ResumeModule } from './modules/resume/resume.module'

@Module({
  imports: [
    // AppModule 作为 server 总装配点：统一注册配置、数据库和核心业务模块。
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: buildServerEnvFilePaths(process.env.NODE_ENV),
    }),
    DatabaseModule,
    AuthModule,
    AiModule,
    ResumeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

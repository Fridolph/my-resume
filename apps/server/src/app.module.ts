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
    /**
     * AppModule 是 server 的总装配点：
     * - ConfigModule 先把根目录 env 注入进来
     * - DatabaseModule 提供全局数据库实例
     * - Auth / Ai / Resume 分别承接鉴权、AI、简历主链路
     */
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

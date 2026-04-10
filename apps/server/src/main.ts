import { NestFactory } from '@nestjs/core'
import type { Express } from 'express'
import { AppModule } from './app.module'

async function bootstrap() {
  /**
   * server 的启动入口保持尽量薄：
   * - 只负责把 AppModule 启起来
   * - 挂基础运行时能力（CORS / ETag / 端口）
   * - 不在这里写业务初始化逻辑
   */
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: true,
  })
  const expressApp = app.getHttpAdapter().getInstance() as Express
  expressApp.set('etag', 'strong')
  await app.listen(process.env.PORT ?? 5577)
}
void bootstrap()

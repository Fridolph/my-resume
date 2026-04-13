import { NestFactory } from '@nestjs/core'
import type { Express } from 'express'
import { AppModule } from './app.module'

/**
 * 启动 Nest server 并挂载基础运行时能力
 * @returns Promise<void>
 */
async function bootstrap() {
  // 启动入口保持薄层：只做容器启动与基础能力挂载，不承载业务初始化逻辑。
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: true,
  })
  const expressApp = app.getHttpAdapter().getInstance() as Express
  expressApp.set('etag', 'strong')
  await app.listen(process.env.PORT ?? 5577)
}
void bootstrap()

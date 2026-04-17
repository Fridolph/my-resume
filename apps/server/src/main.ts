import { NestFactory } from '@nestjs/core'
import { randomUUID } from 'node:crypto'
import type { Express, NextFunction, Request, Response } from 'express'
import { AppModule } from './app.module'
import {
  TRACE_ID_HEADER,
  type RequestWithTraceId,
} from './common/http/trace-id'

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
  expressApp.use((request: Request, response: Response, next: NextFunction) => {
    // 每个请求都注入 traceId，便于统一响应结构与排障定位。
    const requestWithTraceId = request as RequestWithTraceId
    const inboundTraceId = request.headers[TRACE_ID_HEADER]
    const traceId =
      typeof inboundTraceId === 'string' && inboundTraceId.trim().length > 0
        ? inboundTraceId
        : randomUUID()

    requestWithTraceId.traceId = traceId
    response.setHeader(TRACE_ID_HEADER, traceId)
    next()
  })
  expressApp.set('etag', 'strong')
  await app.listen(process.env.PORT ?? 5577)
}
void bootstrap()

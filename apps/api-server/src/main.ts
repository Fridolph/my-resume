import 'reflect-metadata'
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { ApiExceptionFilter } from './common/api-exception.filter.js'
import { ApiResponseInterceptor } from './common/api-response.interceptor.js'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: true,
    credentials: true
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => {
      return new BadRequestException({
        message: '请求参数校验失败',
        validationErrors: errors.map(error => ({
          property: error.property,
          constraints: error.constraints ?? {},
          children: error.children ?? []
        }))
      })
    }
  }))
  app.useGlobalInterceptors(new ApiResponseInterceptor())
  app.useGlobalFilters(new ApiExceptionFilter())

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)

  Logger.log(`API server is running at http://localhost:${port}`, 'Bootstrap')
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap')
  logger.error(error instanceof Error ? error.message : 'Unknown bootstrap error')
  process.exit(1)
})

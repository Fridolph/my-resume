import 'reflect-metadata'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module.js'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }))

  const port = Number(process.env.PORT ?? 3001)
  await app.listen(port)

  Logger.log(`API server is running at http://localhost:${port}`, 'Bootstrap')
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap')
  logger.error(error instanceof Error ? error.message : 'Unknown bootstrap error')
  process.exit(1)
})

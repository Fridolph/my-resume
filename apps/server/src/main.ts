import { NestFactory } from '@nestjs/core'
import type { Express } from 'express'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({
    origin: true,
  })
  const expressApp = app.getHttpAdapter().getInstance() as Express
  expressApp.set('etag', 'strong')
  await app.listen(process.env.PORT ?? 5577)
}
void bootstrap()

import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { ValidationPipe } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import type { INestApplication } from '@nestjs/common'
import type { TestingModule } from '@nestjs/testing'
import { ApiExceptionFilter } from '../../src/common/api-exception.filter.js'
import { ApiResponseInterceptor } from '../../src/common/api-response.interceptor.js'

export const TEST_DATABASE_PATH = resolve(process.cwd(), 'data/platform.test.sqlite')

export async function createTestApp() {
  process.env.REPO_DATABASE_PATH = TEST_DATABASE_PATH

  if (existsSync(TEST_DATABASE_PATH)) {
    rmSync(TEST_DATABASE_PATH, { force: true })
  }

  const databaseModule = await import('@repo/database')
  await databaseModule.migrateDatabase()

  const { AppModule } = await import('../../src/app.module.js')

  const testingModule: TestingModule = await Test.createTestingModule({
    imports: [AppModule]
  }).compile()

  const app: INestApplication = testingModule.createNestApplication()
  app.enableCors({
    origin: true,
    credentials: true
  })
  app.setGlobalPrefix('api')
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true
  }))
  app.useGlobalInterceptors(new ApiResponseInterceptor())
  app.useGlobalFilters(new ApiExceptionFilter())

  await app.init()

  return {
    app,
    testingModule,
    async close() {
      await app.close()
      databaseModule.closeDatabaseConnection(TEST_DATABASE_PATH)
      if (existsSync(TEST_DATABASE_PATH)) {
        rmSync(TEST_DATABASE_PATH, { force: true })
      }
      delete process.env.REPO_DATABASE_PATH
    }
  }
}

import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'
import { configureApiGlobalPrefix } from './../src/server-api-prefix'
import { readApiData } from './helpers/api-envelope'
import {
  assignTempDatabaseUrl,
  restoreTempDatabaseUrl,
} from './helpers/temp-database-env'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>
  let databaseContext: ReturnType<typeof assignTempDatabaseUrl>

  beforeEach(async () => {
    databaseContext = assignTempDatabaseUrl('my-resume-app-e2e')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    configureApiGlobalPrefix(app)
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    restoreTempDatabaseUrl(databaseContext)
  })

  it('/ (GET) should redirect to /api/health', async () => {
    await request(app.getHttpServer())
      .get('/')
      .expect(302)
      .expect('Location', '/api/health')
  })

  it('/api and /api/health should return health payload', async () => {
    const legacyResponse = await request(app.getHttpServer()).get('/api').expect(200)
    const healthResponse = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)

    expect(readApiData(legacyResponse)).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'my-resume-api',
      }),
    )
    expect(readApiData(healthResponse)).toEqual(
      expect.objectContaining({
        status: 'ok',
        service: 'my-resume-api',
      }),
    )
  })

  it('/ai-is-ok should verify current ai provider connectivity', async () => {
    const response = await request(app.getHttpServer()).get('/ai-is-ok').expect(200)
    const payload = readApiData(response)

    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        status: 'ok',
        provider: 'mock',
        mode: 'mock',
      }),
    )
  })

  it('/api/ai-is-ok should keep the same ai connectivity check for compatibility', async () => {
    const response = await request(app.getHttpServer()).get('/api/ai-is-ok').expect(200)
    const payload = readApiData(response)

    expect(payload).toEqual(
      expect.objectContaining({
        ok: true,
        status: 'ok',
        provider: 'mock',
        mode: 'mock',
      }),
    )
  })
})

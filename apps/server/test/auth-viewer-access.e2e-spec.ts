import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'
import { readAccessToken } from './helpers/api-envelope'
import { assignTempDatabaseUrl, restoreTempDatabaseUrl } from './helpers/temp-database-env'

describe('Auth viewer access (e2e)', () => {
  let app: INestApplication<App>
  let databaseContext: ReturnType<typeof assignTempDatabaseUrl>

  beforeEach(async () => {
    databaseContext = assignTempDatabaseUrl('my-resume-auth-viewer-access-e2e')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    restoreTempDatabaseUrl(databaseContext)
  })

  it('should allow viewer to read demo access summary', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .get('/api/auth/demo/viewer-experience')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
  })

  it('should reject viewer when publishing demo content', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .post('/api/auth/demo/publish')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403)
  })

  it('should reject viewer when triggering ai demo action', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .post('/api/auth/demo/ai-analysis')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403)
  })

  it('should allow admin to execute sensitive demo actions', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .post('/api/auth/demo/publish')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    await request(app.getHttpServer())
      .post('/api/auth/demo/ai-analysis')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
  })
})

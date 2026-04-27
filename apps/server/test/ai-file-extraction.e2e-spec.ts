import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'
import { readAccessToken, readApiData } from './helpers/api-envelope'
import { assignTempDatabaseUrl, restoreTempDatabaseUrl } from './helpers/temp-database-env'

describe('AI file extraction (e2e)', () => {
  let app: INestApplication<App>
  let databaseContext: ReturnType<typeof assignTempDatabaseUrl>

  beforeEach(async () => {
    databaseContext = assignTempDatabaseUrl('my-resume-ai-file-e2e')

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

  it('should extract text from uploaded txt file', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    const response = await request(app.getHttpServer())
      .post('/api/ai/extract-text')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('resume text content', 'utf8'), 'resume.txt')
      .expect(201)

    const extractionResult = readApiData<{
      fileType: string
      text: string
    }>(response)

    expect(extractionResult.fileType).toBe('txt')
    expect(extractionResult.text).toContain('resume text content')
  })

  it('should reject unsupported uploaded files', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .post('/api/ai/extract-text')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('a,b,c', 'utf8'), 'resume.csv')
      .expect(400)
  })
})

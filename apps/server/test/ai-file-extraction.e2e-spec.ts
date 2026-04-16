import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'

describe('AI file extraction (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should extract text from uploaded txt file', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = loginResponse.body.accessToken as string

    const response = await request(app.getHttpServer())
      .post('/api/ai/extract-text')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('resume text content', 'utf8'), 'resume.txt')
      .expect(201)

    expect(response.body.fileType).toBe('txt')
    expect(response.body.text).toContain('resume text content')
  })

  it('should reject unsupported uploaded files', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = loginResponse.body.accessToken as string

    await request(app.getHttpServer())
      .post('/api/ai/extract-text')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('a,b,c', 'utf8'), 'resume.csv')
      .expect(400)
  })
})

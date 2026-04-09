import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'

describe('AI report cache (e2e)', () => {
  let app: INestApplication<App>

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
  })

  it('should reuse the same cached mock report for the same input', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = loginResponse.body.accessToken as string
    const payload = {
      scenario: 'jd-match',
      content: 'NestJS React TypeScript Redis BullMQ',
      locale: 'zh',
    }

    const first = await request(app.getHttpServer())
      .post('/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201)

    const second = await request(app.getHttpServer())
      .post('/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201)

    expect(first.body.cached).toBe(false)
    expect(second.body.cached).toBe(true)
    expect(second.body.report.reportId).toBe(first.body.report.reportId)

    const detail = await request(app.getHttpServer())
      .get(`/ai/reports/cache/${first.body.report.reportId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    expect(detail.body.reportId).toBe(first.body.report.reportId)
    expect(detail.body.score.value).toBeGreaterThan(0)
    expect(detail.body.strengths.length).toBeGreaterThan(0)
    expect(detail.body.gaps.length).toBeGreaterThan(0)
    expect(detail.body.risks.length).toBeGreaterThan(0)
    expect(detail.body.suggestions.length).toBeGreaterThan(0)
    expect(detail.body.sections).toHaveLength(4)
  })

  it('should reject unsupported analysis scenarios', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = loginResponse.body.accessToken as string

    await request(app.getHttpServer())
      .post('/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'invalid-scenario',
        content: 'resume content',
      })
      .expect(400)
  })
})

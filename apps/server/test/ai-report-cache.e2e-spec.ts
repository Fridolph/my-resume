import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'
import { readAccessToken, readApiData } from './helpers/api-envelope'

describe('AI report cache (e2e)', () => {
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

  it('should reuse the same cached mock report for the same input', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)
    const payload = {
      scenario: 'jd-match',
      content: 'NestJS React TypeScript Redis BullMQ',
      locale: 'zh',
    }

    const first = await request(app.getHttpServer())
      .post('/api/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201)

    const second = await request(app.getHttpServer())
      .post('/api/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201)

    const firstPayload = readApiData<{
      cached: boolean
      report: { reportId: string }
    }>(first)
    const secondPayload = readApiData<{
      cached: boolean
      report: { reportId: string }
    }>(second)

    expect(firstPayload.cached).toBe(false)
    expect(secondPayload.cached).toBe(true)
    expect(secondPayload.report.reportId).toBe(firstPayload.report.reportId)

    const detail = await request(app.getHttpServer())
      .get(`/api/ai/reports/cache/${firstPayload.report.reportId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    const detailPayload = readApiData<{
      reportId: string
      score: { value: number }
      strengths: unknown[]
      gaps: unknown[]
      risks: unknown[]
      suggestions: unknown[]
      sections: unknown[]
    }>(detail)

    expect(detailPayload.reportId).toBe(firstPayload.report.reportId)
    expect(detailPayload.score.value).toBeGreaterThan(0)
    expect(detailPayload.strengths.length).toBeGreaterThan(0)
    expect(detailPayload.gaps.length).toBeGreaterThan(0)
    expect(detailPayload.risks.length).toBeGreaterThan(0)
    expect(detailPayload.suggestions.length).toBeGreaterThan(0)
    expect(detailPayload.sections).toHaveLength(4)
  })

  it('should reject unsupported analysis scenarios', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .post('/api/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'invalid-scenario',
        content: 'resume content',
      })
      .expect(400)
  })
})

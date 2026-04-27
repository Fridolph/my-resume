import { mkdtempSync, rmSync } from 'fs'
import { INestApplication } from '@nestjs/common'
import { tmpdir } from 'os'
import { join } from 'path'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import type { DatabaseClient } from './../src/database/database.client'
import { DATABASE_CLIENT } from './../src/database/database.tokens'
import { AppModule } from './../src/app.module'
import { readAccessToken, readApiData } from './helpers/api-envelope'

async function prepareResumeTables(client: DatabaseClient) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS resume_drafts (
      resume_key text PRIMARY KEY NOT NULL,
      schema_version integer NOT NULL,
      resume_json text NOT NULL,
      updated_at integer NOT NULL
    );
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS resume_publication_snapshots (
      id text PRIMARY KEY NOT NULL,
      resume_key text NOT NULL,
      schema_version integer NOT NULL,
      resume_json text NOT NULL,
      published_at integer NOT NULL
    );
  `)

  await client.execute(`
    CREATE INDEX IF NOT EXISTS resume_publication_snapshots_resume_key_published_at_idx
    ON resume_publication_snapshots (resume_key, published_at);
  `)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS ai_usage_records (
      id text PRIMARY KEY NOT NULL,
      operation_type text NOT NULL,
      scenario text NOT NULL,
      locale text NOT NULL,
      input_preview text NOT NULL,
      summary text,
      provider text NOT NULL,
      model text NOT NULL,
      mode text NOT NULL,
      generator text NOT NULL,
      status text NOT NULL,
      related_report_id text,
      related_result_id text,
      detail_json text,
      error_message text,
      duration_ms integer NOT NULL,
      created_at integer NOT NULL
    );
  `)

  await client.execute(`
    CREATE INDEX IF NOT EXISTS ai_usage_records_operation_type_created_at_idx
    ON ai_usage_records (operation_type, created_at);
  `)

  await client.execute(`
    CREATE INDEX IF NOT EXISTS ai_usage_records_created_at_idx
    ON ai_usage_records (created_at);
  `)

  await client.execute('DELETE FROM ai_usage_records;')
  await client.execute('DELETE FROM resume_publication_snapshots;')
  await client.execute('DELETE FROM resume_drafts;')
}

describe('AI report role access (e2e)', () => {
  let app: INestApplication<App>
  let previousDatabaseUrl: string | undefined
  let tempDirectory: string

  beforeEach(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL
    tempDirectory = mkdtempSync(join(tmpdir(), 'my-resume-ai-role-e2e-'))
    process.env.DATABASE_URL = `file:${join(tempDirectory, 'ai-report-role-access.db')}`

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    await prepareResumeTables(moduleFixture.get<DatabaseClient>(DATABASE_CLIENT))

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterEach(async () => {
    await app.close()

    if (previousDatabaseUrl) {
      process.env.DATABASE_URL = previousDatabaseUrl
    } else {
      delete process.env.DATABASE_URL
    }

    rmSync(tempDirectory, {
      force: true,
      recursive: true,
    })
  })

  it('should allow viewer to read cached reports but forbid new trigger actions', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    const runtimeResponse = await request(app.getHttpServer())
      .get('/api/ai/reports/runtime')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    const runtimePayload = readApiData<{
      supportedScenarios: string[]
      provider: string
    }>(runtimeResponse)

    expect(runtimePayload.supportedScenarios).toContain('jd-match')
    expect(runtimePayload.provider).toBeDefined()

    const listResponse = await request(app.getHttpServer())
      .get('/api/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    const listPayload = readApiData<{
      reports: Array<{ reportId: string }>
    }>(listResponse)

    expect(listPayload.reports.length).toBeGreaterThanOrEqual(1)

    const reportId = listPayload.reports[0].reportId

    await request(app.getHttpServer())
      .get(`/api/ai/reports/cache/${reportId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    await request(app.getHttpServer())
      .post('/api/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'jd-match',
        content: 'NestJS React TypeScript',
        locale: 'zh',
      })
      .expect(403)

    await request(app.getHttpServer())
      .post('/api/ai/reports/analyze')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'jd-match',
        content: 'NestJS React TypeScript',
        locale: 'zh',
      })
      .expect(403)

    await request(app.getHttpServer())
      .post('/api/ai/reports/resume-optimize')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        instruction: '请帮我优化简历，重点突出 React 与 Next.js 能力',
        locale: 'zh',
      })
      .expect(403)

    await request(app.getHttpServer())
      .post('/api/ai/reports/resume-optimize/apply')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        draftUpdatedAt: '2026-03-31T00:00:00.000Z',
        modules: ['profile'],
        patch: {
          profile: {
            summary: {
              zh: '新的中文摘要',
              en: 'New English summary',
            },
          },
        },
      })
      .expect(403)
  })

  it('should allow admin to trigger analysis and write cached ai results', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    const runtimeResponse = await request(app.getHttpServer())
      .get('/api/ai/reports/runtime')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    const runtimePayload = readApiData<{
      supportedScenarios: string[]
    }>(runtimeResponse)

    expect(runtimePayload.supportedScenarios).toEqual([
      'jd-match',
      'resume-review',
      'offer-compare',
    ])

    const response = await request(app.getHttpServer())
      .post('/api/ai/reports/analyze')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'resume-review',
        content: 'NestJS React TypeScript Resume Review',
        locale: 'zh',
      })
      .expect(201)

    const analyzePayload = readApiData<{
      report: {
        generator: string
        summary: string
        score: { value: number }
        strengths: unknown[]
        gaps: unknown[]
        risks: unknown[]
        suggestions: unknown[]
      }
    }>(response)

    expect(analyzePayload.report.generator).toBe('ai-provider')
    expect(analyzePayload.report.summary.length).toBeGreaterThan(0)
    expect(analyzePayload.report.score.value).toBeGreaterThan(0)
    expect(analyzePayload.report.strengths.length).toBeGreaterThan(0)
    expect(analyzePayload.report.gaps.length).toBeGreaterThan(0)
    expect(analyzePayload.report.risks.length).toBeGreaterThan(0)
    expect(analyzePayload.report.suggestions.length).toBeGreaterThan(0)

    const optimizeResponse = await request(app.getHttpServer())
      .post('/api/ai/reports/resume-optimize')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        instruction: '请根据 React 与 Next.js 相关岗位方向优化当前简历',
        locale: 'zh',
      })
      .expect(201)

    const optimizePayload = readApiData<{
      summary: string
      changedModules: string[]
      moduleDiffs: unknown[]
      resultId: string
      usageRecordId: string
    }>(optimizeResponse)

    expect(optimizePayload.summary.length).toBeGreaterThan(0)
    expect(optimizePayload.changedModules).toContain('profile')
    expect(optimizePayload.moduleDiffs.length).toBeGreaterThan(0)
    expect(optimizePayload.resultId).toBeTruthy()
    expect(optimizePayload.usageRecordId).toBeTruthy()

    const applyResponse = await request(app.getHttpServer())
      .post('/api/ai/reports/resume-optimize/apply')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        resultId: optimizePayload.resultId,
        modules: ['profile'],
      })
      .expect(200)

    const applyPayload = readApiData<{
      status: string
      resume: {
        profile: {
          summary: {
            zh: string
          }
        }
        projects: Array<{
          summary: {
            zh: string
          }
        }>
      }
    }>(applyResponse)

    expect(applyPayload.status).toBe('draft')
    expect(applyPayload.resume.profile.summary.zh).not.toBe('')
    expect(applyPayload.resume.projects[0].summary.zh).toBe(
      '为全球光伏安装商提供在线项目设计与报价服务，支持多国家、多税率、多币种的复杂业务场景。',
    )
  })
})

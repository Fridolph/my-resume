import { mkdtempSync, rmSync } from 'fs';
import { INestApplication } from '@nestjs/common';
import { tmpdir } from 'os';
import { join } from 'path';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import type { DatabaseClient } from './../src/database/database.client';
import { DATABASE_CLIENT } from './../src/database/database.tokens';
import { AppModule } from './../src/app.module';

async function prepareResumeTables(client: DatabaseClient) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS resume_drafts (
      resume_key text PRIMARY KEY NOT NULL,
      schema_version integer NOT NULL,
      resume_json text NOT NULL,
      updated_at integer NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS resume_publication_snapshots (
      id text PRIMARY KEY NOT NULL,
      resume_key text NOT NULL,
      schema_version integer NOT NULL,
      resume_json text NOT NULL,
      published_at integer NOT NULL
    );
  `);

  await client.execute(`
    CREATE INDEX IF NOT EXISTS resume_publication_snapshots_resume_key_published_at_idx
    ON resume_publication_snapshots (resume_key, published_at);
  `);

  await client.execute('DELETE FROM resume_publication_snapshots;');
  await client.execute('DELETE FROM resume_drafts;');
}

describe('AI report role access (e2e)', () => {
  let app: INestApplication<App>;
  let previousDatabaseUrl: string | undefined;
  let tempDirectory: string;

  beforeEach(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    tempDirectory = mkdtempSync(join(tmpdir(), 'my-resume-ai-role-e2e-'));
    process.env.DATABASE_URL = `file:${join(tempDirectory, 'ai-report-role-access.db')}`;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    await prepareResumeTables(moduleFixture.get<DatabaseClient>(DATABASE_CLIENT));

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();

    if (previousDatabaseUrl) {
      process.env.DATABASE_URL = previousDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }

    rmSync(tempDirectory, {
      force: true,
      recursive: true,
    });
  });

  it('should allow viewer to read cached reports but forbid new trigger actions', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    const runtimeResponse = await request(app.getHttpServer())
      .get('/ai/reports/runtime')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(runtimeResponse.body.supportedScenarios).toContain('jd-match');
    expect(runtimeResponse.body.provider).toBeDefined();

    const listResponse = await request(app.getHttpServer())
      .get('/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listResponse.body.reports.length).toBeGreaterThanOrEqual(1);

    const reportId = listResponse.body.reports[0].reportId as string;

    await request(app.getHttpServer())
      .get(`/ai/reports/cache/${reportId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/ai/reports/cache')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'jd-match',
        content: 'NestJS React TypeScript',
        locale: 'zh',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/ai/reports/analyze')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'jd-match',
        content: 'NestJS React TypeScript',
        locale: 'zh',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/ai/reports/resume-optimize')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        instruction: '请帮我优化简历，重点突出 React 与 Next.js 能力',
        locale: 'zh',
      })
      .expect(403);

    await request(app.getHttpServer())
      .post('/ai/reports/resume-optimize/apply')
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
      .expect(403);
  });

  it('should allow admin to trigger analysis and write cached ai results', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    const runtimeResponse = await request(app.getHttpServer())
      .get('/ai/reports/runtime')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(runtimeResponse.body.supportedScenarios).toEqual([
      'jd-match',
      'resume-review',
      'offer-compare',
    ]);

    const response = await request(app.getHttpServer())
      .post('/ai/reports/analyze')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        scenario: 'resume-review',
        content: 'NestJS React TypeScript Resume Review',
        locale: 'zh',
      })
      .expect(201);

    expect(response.body.report.generator).toBe('ai-provider');
    expect(response.body.report.summary.length).toBeGreaterThan(0);
    expect(response.body.report.score.value).toBeGreaterThan(0);
    expect(response.body.report.strengths.length).toBeGreaterThan(0);
    expect(response.body.report.gaps.length).toBeGreaterThan(0);
    expect(response.body.report.risks.length).toBeGreaterThan(0);
    expect(response.body.report.suggestions.length).toBeGreaterThan(0);

    const optimizeResponse = await request(app.getHttpServer())
      .post('/ai/reports/resume-optimize')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        instruction: '请根据 React 与 Next.js 相关岗位方向优化当前简历',
        locale: 'zh',
      })
      .expect(201);

    expect(optimizeResponse.body.summary.length).toBeGreaterThan(0);
    expect(optimizeResponse.body.changedModules).toContain('profile');
    expect(optimizeResponse.body.moduleDiffs.length).toBeGreaterThan(0);
    expect(optimizeResponse.body.applyPayload.draftUpdatedAt).toBeTruthy();
    expect(optimizeResponse.body.suggestedResume.meta.slug).toBe('standard-resume');

    const applyResponse = await request(app.getHttpServer())
      .post('/ai/reports/resume-optimize/apply')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        draftUpdatedAt: optimizeResponse.body.applyPayload.draftUpdatedAt,
        modules: ['profile'],
        patch: optimizeResponse.body.applyPayload.patch,
      })
      .expect(200);

    expect(applyResponse.body.status).toBe('draft');
    expect(applyResponse.body.resume.profile.summary.zh).not.toBe('');
    expect(applyResponse.body.resume.projects[0].summary.zh).toBe(
      '为全球光伏安装商提供在线项目设计与报价服务，支持多国家、多税率、多币种的复杂业务场景。',
    );
  });
});

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('AI report role access (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
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
  });
});

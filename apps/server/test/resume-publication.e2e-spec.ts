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

describe('Resume publication flow (e2e)', () => {
  let app: INestApplication<App>;
  let previousDatabaseUrl: string | undefined;
  let tempDirectory: string;

  beforeEach(async () => {
    previousDatabaseUrl = process.env.DATABASE_URL;
    tempDirectory = mkdtempSync(join(tmpdir(), 'my-resume-resume-e2e-'));
    process.env.DATABASE_URL = `file:${join(tempDirectory, 'resume-publication.db')}`;

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

  it('should hide unpublished resume from the public endpoint', () => {
    return request(app.getHttpServer()).get('/resume/published').expect(404);
  });

  it('should hide unpublished markdown export from the public endpoint', () => {
    return request(app.getHttpServer())
      .get('/resume/published/export/markdown')
      .expect(404);
  });

  it('should allow admin to update draft and publish it', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    const draftResponse = await request(app.getHttpServer())
      .put('/resume/draft')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        meta: {
          slug: 'standard-resume',
          version: 1,
          defaultLocale: 'zh',
          locales: ['zh', 'en'],
        },
        profile: {
          fullName: {
            zh: '付寅生',
            en: 'Yinsheng Fu',
          },
          headline: {
            zh: '已发布候选稿',
            en: 'Publish Candidate',
          },
          summary: {
            zh: '草稿内容',
            en: 'Draft content',
          },
          location: {
            zh: '上海',
            en: 'Shanghai',
          },
          email: 'demo@example.com',
          phone: '+86 13800000000',
          website: 'https://example.com',
          hero: {
            frontImageUrl: '/img/avatar.jpg',
            backImageUrl: '/img/avatar2.jpg',
            linkUrl: 'https://github.com/Fridolph/my-resume',
            slogans: [
              {
                zh: '热爱Coding，生命不息，折腾不止',
                en: 'Driven by coding, always building, always iterating',
              },
              {
                zh: '羽毛球爱好者，快乐挥拍，球场飞翔',
                en: 'Badminton lover, happy swings, full-court energy',
              },
            ],
          },
          links: [],
          interests: [],
        },
        education: [],
        experiences: [],
        projects: [],
        skills: [],
        highlights: [],
      })
      .expect(200);

    expect(draftResponse.body.status).toBe('draft');

    const publishResponse = await request(app.getHttpServer())
      .post('/resume/publish')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(publishResponse.body.status).toBe('published');
    expect(publishResponse.body.resume.profile.headline).toEqual({
      zh: '已发布候选稿',
      en: 'Publish Candidate',
    });

    const publicResponse = await request(app.getHttpServer())
      .get('/resume/published')
      .expect(200);

    expect(publicResponse.body.resume.profile.headline).toEqual({
      zh: '已发布候选稿',
      en: 'Publish Candidate',
    });

    const markdownResponse = await request(app.getHttpServer())
      .get('/resume/published/export/markdown?locale=en')
      .expect(200);

    expect(markdownResponse.headers['content-type']).toContain('text/markdown');
    expect(markdownResponse.headers['content-disposition']).toContain(
      'standard-resume-en.md',
    );
    expect(markdownResponse.text).toContain('# Yinsheng Fu');
    expect(markdownResponse.text).toContain('## Summary');
    expect(markdownResponse.text).toContain('Publish Candidate');

    const pdfResponse = await request(app.getHttpServer())
      .get('/resume/published/export/pdf?locale=zh')
      .expect(200);

    expect(pdfResponse.headers['content-type']).toContain('application/pdf');
    expect(pdfResponse.headers['content-disposition']).toContain(
      'standard-resume-zh.pdf',
    );
  });

  it('should keep viewer read-only for draft and publish actions', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    await request(app.getHttpServer())
      .put('/resume/draft')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({})
      .expect(403);

    await request(app.getHttpServer())
      .post('/resume/publish')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('should reject unsupported markdown export locale', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/resume/publish')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/resume/published/export/markdown?locale=ja')
      .expect(400);
  });

  it('should reject unsupported pdf export locale', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    await request(app.getHttpServer())
      .post('/resume/publish')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/resume/published/export/pdf?locale=ja')
      .expect(400);
  });
});

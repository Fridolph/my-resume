import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('Resume publication flow (e2e)', () => {
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

  it('should hide unpublished resume from the public endpoint', () => {
    return request(app.getHttpServer()).get('/resume/published').expect(404);
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
});

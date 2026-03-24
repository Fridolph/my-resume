import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('Auth viewer access (e2e)', () => {
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

  it('should allow viewer to read demo access summary', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200);

    await request(app.getHttpServer())
      .get('/auth/demo/viewer-experience')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`)
      .expect(200);
  });

  it('should reject viewer when publishing demo content', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/demo/publish')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`)
      .expect(403);
  });

  it('should reject viewer when triggering ai demo action', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/demo/ai-analysis')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`)
      .expect(403);
  });

  it('should allow admin to execute sensitive demo actions', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/demo/publish')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/demo/ai-analysis')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken as string}`)
      .expect(200);
  });
});

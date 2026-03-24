import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';

import { AppModule } from './../src/app.module';

describe('AuthModule (e2e)', () => {
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

  it('should login with the demo admin account', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      tokenType: 'Bearer',
      user: {
        username: 'admin',
        role: 'admin',
        isActive: true,
      },
    });
    expect(response.body.accessToken).toEqual(expect.any(String));
  });

  it('should reject invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'admin',
        password: 'wrong-password',
      })
      .expect(401);
  });

  it('should read current user from bearer token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200);

    const accessToken = loginResponse.body.accessToken as string;

    const meResponse = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(meResponse.body).toMatchObject({
      user: {
        username: 'viewer',
        role: 'viewer',
        isActive: true,
        capabilities: {
          canEditResume: false,
          canPublishResume: false,
          canTriggerAiAnalysis: false,
        },
      },
    });
  });

  it('should reject protected access without bearer token', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});

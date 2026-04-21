import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'

import { AppModule } from './../src/app.module'
import { readAccessToken, readApiData } from './helpers/api-envelope'

describe('AuthModule (e2e)', () => {
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

  it('should login with the demo admin account', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const loginPayload = readApiData<{
      accessToken: string
      tokenType: string
      user: {
        username: string
        role: string
        isActive: boolean
      }
    }>(response)

    expect(loginPayload).toMatchObject({
      tokenType: 'Bearer',
      user: {
        username: 'admin',
        role: 'admin',
        isActive: true,
      },
    })
    expect(loginPayload.accessToken).toEqual(expect.any(String))
  })

  it('should reject invalid credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'wrong-password',
      })
      .expect(401)
  })

  it('should read current user from bearer token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    const meResponse = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)

    const currentUserPayload = readApiData<{
      user: {
        username: string
        role: string
        isActive: boolean
        capabilities: {
          canEditResume: boolean
          canPublishResume: boolean
          canTriggerAiAnalysis: boolean
        }
      }
    }>(meResponse)

    expect(currentUserPayload).toMatchObject({
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
    })
  })

  it('should reject protected access without bearer token', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401)
  })
})

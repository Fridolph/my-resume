import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from './../src/app.module'
import { readApiData } from './helpers/api-envelope'
import { assignTempDatabaseUrl, restoreTempDatabaseUrl } from './helpers/temp-database-env'

describe('AppController (e2e)', () => {
  let app: INestApplication<App>
  let databaseContext: ReturnType<typeof assignTempDatabaseUrl>

  beforeEach(async () => {
    databaseContext = assignTempDatabaseUrl('my-resume-app-e2e')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    restoreTempDatabaseUrl(databaseContext)
  })

  it('/ (GET)', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200)
    const payload = readApiData<string>(response)

    expect(payload).toBe('Hello World!')
  })
})

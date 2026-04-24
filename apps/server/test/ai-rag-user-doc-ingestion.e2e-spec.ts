import { INestApplication } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import request from 'supertest'
import { App } from 'supertest/types'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AppModule } from '../src/app.module'
import { UserDocsIngestionService } from '../src/modules/ai/rag/user-docs-ingestion.service'
import { readAccessToken, readApiData } from './helpers/api-envelope'
import { assignTempDatabaseUrl, restoreTempDatabaseUrl } from './helpers/temp-database-env'

describe('AI RAG user docs ingestion (e2e)', () => {
  let app: INestApplication<App>
  const ingest = vi.fn()
  let databaseContext: ReturnType<typeof assignTempDatabaseUrl>

  beforeEach(async () => {
    ingest.mockReset()
    databaseContext = assignTempDatabaseUrl('my-resume-rag-user-doc-ingestion-e2e')

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UserDocsIngestionService)
      .useValue({ ingest })
      .compile()

    app = moduleFixture.createNestApplication()
    app.setGlobalPrefix('api')
    await app.init()
  })

  afterEach(async () => {
    await app.close()
    restoreTempDatabaseUrl(databaseContext)
  })

  it('should allow admin to ingest user docs with published scope', async () => {
    ingest.mockResolvedValue({
      documentId: 'user-doc:abc123:und',
      sourceId: 'abc123',
      sourceScope: 'published',
      sourceVersion: 'upload:1776839100000',
      chunkCount: 2,
      fileName: 'rag-notes.md',
      fileType: 'md',
      uploadedAt: '2026-04-22T03:45:00.000Z',
    })

    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    const response = await request(app.getHttpServer())
      .post('/api/ai/rag/ingest/user-doc')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('scope', 'published')
      .attach('file', Buffer.from('# RAG notes', 'utf8'), 'rag-notes.md')
      .expect(201)

    expect(ingest).toHaveBeenCalledTimes(1)
    expect(ingest).toHaveBeenCalledWith(
      expect.objectContaining({
        originalname: 'rag-notes.md',
        sourceScope: 'published',
      }),
    )

    const payload = readApiData<{
      sourceScope: string
      fileName: string
      chunkCount: number
    }>(response)

    expect(payload.sourceScope).toBe('published')
    expect(payload.fileName).toBe('rag-notes.md')
    expect(payload.chunkCount).toBe(2)
  })

  it('should reject viewer when ingesting user docs', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'viewer',
        password: 'viewer123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .post('/api/ai/rag/ingest/user-doc')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('scope', 'draft')
      .attach('file', Buffer.from('viewer cannot ingest', 'utf8'), 'notes.txt')
      .expect(403)

    expect(ingest).not.toHaveBeenCalled()
  })

  it('should reject ingest request without file', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123456',
      })
      .expect(200)

    const accessToken = readAccessToken(loginResponse)

    await request(app.getHttpServer())
      .post('/api/ai/rag/ingest/user-doc')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('scope', 'draft')
      .expect(400)

    expect(ingest).not.toHaveBeenCalled()
  })
})

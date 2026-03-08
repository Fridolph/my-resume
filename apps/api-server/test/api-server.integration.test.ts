import request from 'supertest'
import type { INestApplication } from '@nestjs/common'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createTestApp } from './helpers/test-app.js'

function toResumeUpdatePayload(input: Record<string, unknown>) {
  return {
    id: input.id,
    status: input.status,
    updatedAt: input.updatedAt,
    locales: input.locales
  }
}

describe('API Server critical workflow', () => {
  let app: INestApplication
  let closeApp: (() => Promise<void>) | null = null
  let agent: ReturnType<typeof request.agent>

  beforeAll(async () => {
    const testApp = await createTestApp()
    app = testApp.app
    closeApp = testApp.close
    agent = request.agent(app.getHttpServer())
  })

  afterAll(async () => {
    if (closeApp) {
      await closeApp()
    }
  })

  it('blocks protected routes before login', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/admin/users')

    expect(response.status).toBe(401)
    expect(response.body.success).toBe(false)
  })

  it('logs in and stores session cookie', async () => {
    const response = await agent
      .post('/api/admin/auth/login')
      .send({
        email: 'root@fridolph.local',
        password: 'root123'
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.session.email).toBe('root@fridolph.local')
    expect(response.headers['set-cookie']).toBeDefined()
  })

  it('enforces publish status transitions', async () => {
    const resumeResponse = await agent.get('/api/admin/resume')

    expect(resumeResponse.status).toBe(200)

    const draftResume = toResumeUpdatePayload(resumeResponse.body.data)
    const invalidPublished = await agent
      .put('/api/admin/resume')
      .send({
        ...draftResume,
        status: 'published'
      })

    expect(invalidPublished.status).toBe(400)
    expect(invalidPublished.body.error.statusCode).toBe(400)

    const reviewing = await agent
      .put('/api/admin/resume')
      .send({
        ...draftResume,
        status: 'reviewing'
      })

    expect(reviewing.status).toBe(200)
    expect(reviewing.body.data.status).toBe('reviewing')
    expect(reviewing.body.data.updatedBy.email).toBe('root@fridolph.local')

    const published = await agent
      .put('/api/admin/resume')
      .send({
        ...toResumeUpdatePayload(reviewing.body.data),
        status: 'published'
      })

    expect(published.status).toBe(200)
    expect(published.body.data.status).toBe('published')
    expect(published.body.data.reviewedBy.email).toBe('root@fridolph.local')
    expect(published.body.data.publishedAt).toBeTruthy()
  })

  it('creates version snapshots and restore versions', async () => {
    const versionsBefore = await agent.get('/api/admin/resume/versions')

    expect(versionsBefore.status).toBe(200)
    expect(versionsBefore.body.data.length).toBeGreaterThanOrEqual(2)

    const seedVersion = versionsBefore.body.data.at(-1)

    const restored = await agent
      .post(`/api/admin/resume/versions/${seedVersion.id}/restore`)

    expect(restored.status).toBe(201)
    expect(restored.body.data.updatedBy.email).toBe('root@fridolph.local')

    const versionsAfter = await agent.get('/api/admin/resume/versions')

    expect(versionsAfter.status).toBe(200)
    expect(versionsAfter.body.data[0].changeType).toBe('restore')
  })

  it('creates and activates unified releases for public content', async () => {
    const resumeResponse = await agent.get('/api/admin/resume')
    const currentResume = toResumeUpdatePayload(resumeResponse.body.data)

    const reviewing = await agent
      .put('/api/admin/resume')
      .send({
        ...currentResume,
        status: 'reviewing'
      })

    expect(reviewing.status).toBe(200)

    const published = await agent
      .put('/api/admin/resume')
      .send({
        ...toResumeUpdatePayload(reviewing.body.data),
        status: 'published'
      })

    expect(published.status).toBe(200)

    const firstRelease = await agent.post('/api/admin/releases/publish')

    expect(firstRelease.status).toBe(201)
    expect(firstRelease.body.data.status).toBe('active')

    const secondRelease = await agent.post('/api/admin/releases/publish')

    expect(secondRelease.status).toBe(201)
    expect(secondRelease.body.data.status).toBe('active')

    const reactivated = await agent
      .post(`/api/admin/releases/${firstRelease.body.data.id}/activate`)

    expect(reactivated.status).toBe(201)
    expect(reactivated.body.data.id).toBe(firstRelease.body.data.id)
    expect(reactivated.body.data.status).toBe('active')

    const releases = await agent.get('/api/admin/releases')

    expect(releases.status).toBe(200)
    expect(releases.body.data.some((item: { id: string, status: string }) => item.id === firstRelease.body.data.id && item.status === 'active')).toBe(true)
    expect(releases.body.data.some((item: { id: string, status: string }) => item.id === secondRelease.body.data.id && item.status === 'archived')).toBe(true)

    const publicRelease = await request(app.getHttpServer())
      .get('/api/public/release')

    expect(publicRelease.status).toBe(200)
    expect(publicRelease.body.data.release.id).toBe(firstRelease.body.data.id)
    expect(publicRelease.body.data.resume.status).toBe('published')

    const publicResume = await request(app.getHttpServer())
      .get('/api/public/resume')

    expect(publicResume.status).toBe(200)
    expect(publicResume.body.data.status).toBe('published')
  })
})

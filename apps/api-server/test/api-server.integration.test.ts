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

  it('enforces permission boundaries across different roles', async () => {
    const translatorAgent = request.agent(app.getHttpServer())
    const translatorLogin = await translatorAgent
      .post('/api/admin/auth/login')
      .send({
        email: 'translator@fridolph.local',
        password: 'translator123'
      })

    expect(translatorLogin.status).toBe(200)

    const translatorTranslations = await translatorAgent.get('/api/admin/translations')
    expect(translatorTranslations.status).toBe(200)

    const translatorUsers = await translatorAgent.get('/api/admin/users')
    expect(translatorUsers.status).toBe(403)
    expect(translatorUsers.body.error.code).toBe('FORBIDDEN')

    const viewerAgent = request.agent(app.getHttpServer())
    const viewerLogin = await viewerAgent
      .post('/api/admin/auth/login')
      .send({
        email: 'viewer@fridolph.local',
        password: 'viewer123'
      })

    expect(viewerLogin.status).toBe(200)

    const translations = await viewerAgent.get('/api/admin/translations')
    expect(translations.status).toBe(200)

    const record = translations.body.data.find((item: { locale: string }) => item.locale === 'zh-CN') ?? translations.body.data[0]
    const viewerUpdate = await viewerAgent
      .put(`/api/admin/translations/${record.id}`)
      .send({
        namespace: record.namespace,
        key: record.key,
        locale: record.locale,
        value: record.value,
        status: record.status
      })

    expect(viewerUpdate.status).toBe(403)
    expect(viewerUpdate.body.error.code).toBe('FORBIDDEN')
  })

  it('updates translation versions and republishes public translations', async () => {
    const translations = await agent.get('/api/admin/translations')

    expect(translations.status).toBe(200)

    const record = translations.body.data.find((item: { locale: string, status: string, missing: boolean }) => item.locale === 'zh-CN' && item.status === 'published' && !item.missing)
      ?? translations.body.data[0]

    const versionsBefore = await agent.get(`/api/admin/translations/${record.id}/versions`)
    expect(versionsBefore.status).toBe(200)

    const updatedValue = `${record.value} [api-test]`
    const updated = await agent
      .put(`/api/admin/translations/${record.id}`)
      .send({
        namespace: record.namespace,
        key: record.key,
        locale: record.locale,
        value: updatedValue,
        status: record.status
      })

    expect(updated.status).toBe(200)
    expect(updated.body.data.value).toContain('[api-test]')
    expect(updated.body.data.updatedBy.email).toBe('root@fridolph.local')

    const versionsAfter = await agent.get(`/api/admin/translations/${record.id}/versions`)
    expect(versionsAfter.status).toBe(200)
    expect(versionsAfter.body.data[0].changeType).toBe('update')
    expect(versionsAfter.body.data.length).toBeGreaterThan(versionsBefore.body.data.length)

    const release = await agent.post('/api/admin/releases/publish')
    expect(release.status).toBe(201)

    const publicTranslations = await request(app.getHttpServer())
      .get('/api/public/translations')
      .query({ locale: record.locale })

    expect(publicTranslations.status).toBe(200)
    expect(publicTranslations.body.data.some((item: { key: string, value: string }) => item.key === record.key && item.value === updatedValue)).toBe(true)
  })

  it('creates, publishes and removes project records through the public release chain', async () => {
    const uniqueSlug = `playwright-project-${Date.now()}`
    const created = await agent
      .post('/api/admin/projects')
      .send({
        slug: uniqueSlug,
        status: 'draft',
        sortOrder: 999,
        cover: 'https://example.com/cover.png',
        externalUrl: 'https://example.com/project',
        tags: ['Playwright', 'API'],
        locales: {
          'zh-CN': {
            locale: 'zh-CN',
            title: 'Playwright 项目',
            description: '用于测试 API 项目链路。',
            summary: '验证创建、发布、公开读取与删除。'
          },
          'en-US': {
            locale: 'en-US',
            title: 'Playwright Project',
            description: 'Used to test the API project workflow.',
            summary: 'Covers create, publish, public read, and delete.'
          }
        }
      })

    expect(created.status).toBe(201)
    expect(created.body.data.slug).toBe(uniqueSlug)
    expect(created.body.data.updatedBy.email).toBe('root@fridolph.local')

    const reviewing = await agent
      .put(`/api/admin/projects/${created.body.data.id}`)
      .send({
        slug: created.body.data.slug,
        status: 'reviewing',
        sortOrder: created.body.data.sortOrder,
        cover: created.body.data.cover,
        externalUrl: created.body.data.externalUrl,
        tags: created.body.data.tags,
        locales: created.body.data.locales
      })

    expect(reviewing.status).toBe(200)
    expect(reviewing.body.data.status).toBe('reviewing')

    const published = await agent
      .put(`/api/admin/projects/${created.body.data.id}`)
      .send({
        slug: reviewing.body.data.slug,
        status: 'published',
        sortOrder: reviewing.body.data.sortOrder,
        cover: reviewing.body.data.cover,
        externalUrl: reviewing.body.data.externalUrl,
        tags: reviewing.body.data.tags,
        locales: reviewing.body.data.locales
      })

    expect(published.status).toBe(200)
    expect(published.body.data.status).toBe('published')
    expect(published.body.data.publishedAt).toBeTruthy()

    const projectVersions = await agent.get(`/api/admin/projects/${created.body.data.id}/versions`)
    expect(projectVersions.status).toBe(200)
    expect(projectVersions.body.data.length).toBeGreaterThanOrEqual(3)

    const release = await agent.post('/api/admin/releases/publish')
    expect(release.status).toBe(201)

    const publicProjects = await request(app.getHttpServer())
      .get('/api/public/projects')

    expect(publicProjects.status).toBe(200)
    expect(publicProjects.body.data.some((item: { slug: string }) => item.slug === uniqueSlug)).toBe(true)

    const removed = await agent.delete(`/api/admin/projects/${created.body.data.id}`)
    expect(removed.status).toBe(200)
    expect(removed.body.data.success).toBe(true)

    const releaseAfterDelete = await agent.post('/api/admin/releases/publish')
    expect(releaseAfterDelete.status).toBe(201)

    const publicProjectsAfterDelete = await request(app.getHttpServer())
      .get('/api/public/projects')

    expect(publicProjectsAfterDelete.status).toBe(200)
    expect(publicProjectsAfterDelete.body.data.some((item: { slug: string }) => item.slug === uniqueSlug)).toBe(false)
  })

})

import type {
  ContentActorSummary,
  ContentReleaseRecord,
  ProjectRecord,
  PublicReleaseSnapshot,
  ResumeDocument,
  TranslationRecord,
  UserSession
} from '@repo/types'
import { asc, desc, eq } from 'drizzle-orm'
import { db } from './client.js'
import { createSystemActor } from './content-audit.js'
import { getContentVersionById, listContentVersions } from './content-versions.js'
import { listProjects } from './projects.js'
import { getResumeDocument } from './resume-documents.js'
import type { ContentReleaseInsert, ContentReleaseRow } from './schema/index.js'
import { contentReleases } from './schema/index.js'
import { listTranslations } from './translations.js'

function fromRow(row: ContentReleaseRow): ContentReleaseRecord {
  return {
    id: row.id,
    name: row.name,
    status: row.status as ContentReleaseRecord['status'],
    resumeVersionId: row.resumeVersionId,
    translationVersionIds: JSON.parse(row.translationVersionIds) as string[],
    projectVersionIds: JSON.parse(row.projectVersionIds) as string[],
    createdBy: row.createdBy ? JSON.parse(row.createdBy) as ContentActorSummary : null,
    activatedBy: row.activatedBy ? JSON.parse(row.activatedBy) as ContentActorSummary : null,
    activatedAt: row.activatedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  }
}

function toRow(record: ContentReleaseRecord): ContentReleaseInsert {
  return {
    id: record.id,
    name: record.name,
    status: record.status,
    resumeVersionId: record.resumeVersionId,
    translationVersionIds: JSON.stringify(record.translationVersionIds),
    projectVersionIds: JSON.stringify(record.projectVersionIds),
    createdBy: record.createdBy ? JSON.stringify(record.createdBy) : null,
    activatedBy: record.activatedBy ? JSON.stringify(record.activatedBy) : null,
    activatedAt: record.activatedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  }
}

export async function listContentReleases() {
  const rows = await db.select().from(contentReleases).orderBy(desc(contentReleases.createdAt), desc(contentReleases.updatedAt))
  return rows.map(fromRow)
}

export async function getContentReleaseById(releaseId: string) {
  const [row] = await db.select().from(contentReleases).where(eq(contentReleases.id, releaseId)).limit(1)
  return row ? fromRow(row) : null
}

export async function getActiveContentRelease() {
  const [row] = await db.select().from(contentReleases).where(eq(contentReleases.status, 'active')).limit(1)
  return row ? fromRow(row) : null
}

async function getLatestVersionId(moduleType: 'translation' | 'resume' | 'project', entityId: string) {
  const versions = await listContentVersions(moduleType, entityId)
  return versions[0]?.id ?? null
}

async function buildReleaseReferences() {
  const [resumeDocument, translationRecords, projectRecords] = await Promise.all([
    getResumeDocument(),
    listTranslations(),
    listProjects()
  ])

  if (resumeDocument.status !== 'published') {
    throw new Error('当前没有可用于公开发布的已发布简历版本。')
  }

  const resumeVersionId = await getLatestVersionId('resume', resumeDocument.id)

  if (!resumeVersionId) {
    throw new Error('当前已发布简历缺少对应版本记录。')
  }

  const publishedTranslations = translationRecords.filter(record => record.status === 'published' && !record.missing)
  const translationVersionIds = (await Promise.all(
    publishedTranslations.map(record => getLatestVersionId('translation', record.id))
  )).filter((value): value is string => Boolean(value))

  const publishedProjects = projectRecords.filter(record => record.status === 'published')
  const projectVersionIds = (await Promise.all(
    publishedProjects.map(record => getLatestVersionId('project', record.id))
  )).filter((value): value is string => Boolean(value))

  return {
    resumeVersionId,
    translationVersionIds,
    projectVersionIds
  }
}

async function archiveActiveRelease(timestamp: string) {
  const activeRelease = await getActiveContentRelease()

  if (!activeRelease) {
    return null
  }

  await db.update(contentReleases)
    .set({ status: 'archived', updatedAt: timestamp })
    .where(eq(contentReleases.id, activeRelease.id))

  return activeRelease.id
}

export async function createAndActivateContentRelease(actor: Pick<UserSession, 'id' | 'name' | 'email'>) {
  const timestamp = new Date().toISOString()
  const references = await buildReleaseReferences()
  await archiveActiveRelease(timestamp)

  const nextRelease: ContentReleaseRecord = {
    id: `release_${crypto.randomUUID()}`,
    name: `公开发布 ${new Date(timestamp).toLocaleString('zh-CN', { hour12: false })}`,
    status: 'active',
    resumeVersionId: references.resumeVersionId,
    translationVersionIds: references.translationVersionIds,
    projectVersionIds: references.projectVersionIds,
    createdBy: actor,
    activatedBy: actor,
    activatedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp
  }

  await db.insert(contentReleases).values(toRow(nextRelease))
  return nextRelease
}

export async function activateContentRelease(releaseId: string, actor: Pick<UserSession, 'id' | 'name' | 'email'>) {
  const release = await getContentReleaseById(releaseId)

  if (!release) {
    throw new Error('Content release not found')
  }

  const timestamp = new Date().toISOString()
  await archiveActiveRelease(timestamp)

  const nextRelease: ContentReleaseRecord = {
    ...release,
    status: 'active',
    activatedBy: actor,
    activatedAt: timestamp,
    updatedAt: timestamp
  }

  await db.update(contentReleases)
    .set(toRow(nextRelease))
    .where(eq(contentReleases.id, releaseId))

  return nextRelease
}

export async function ensureActiveContentRelease() {
  const activeRelease = await getActiveContentRelease()

  if (activeRelease) {
    return activeRelease
  }

  const systemActor = createSystemActor()
  return await createAndActivateContentRelease(systemActor)
}

export async function resolveContentReleaseSnapshot(release: ContentReleaseRecord): Promise<PublicReleaseSnapshot> {
  const resumeVersion = await getContentVersionById<'resume'>(release.resumeVersionId)

  if (!resumeVersion) {
    throw new Error('Active release resume version not found')
  }

  const translationVersions = await Promise.all(
    release.translationVersionIds.map(versionId => getContentVersionById<'translation'>(versionId))
  )
  const projectVersions = await Promise.all(
    release.projectVersionIds.map(versionId => getContentVersionById<'project'>(versionId))
  )

  return {
    release,
    resume: resumeVersion.snapshot as ResumeDocument,
    translations: translationVersions.filter((item): item is NonNullable<typeof item> => Boolean(item)).map(item => item.snapshot as TranslationRecord),
    projects: projectVersions.filter((item): item is NonNullable<typeof item> => Boolean(item)).map(item => item.snapshot as ProjectRecord)
  }
}

export async function getActivePublicReleaseSnapshot() {
  try {
    const activeRelease = await ensureActiveContentRelease()
    return await resolveContentReleaseSnapshot(activeRelease)
  } catch {
    const [resumeDocument, translationRecords, projectRecords] = await Promise.all([
      getResumeDocument(),
      listTranslations(),
      listProjects()
    ])

    const fallbackRelease: ContentReleaseRecord = {
      id: 'release_fallback_preview',
      name: 'Fallback Preview Release',
      status: 'draft',
      resumeVersionId: 'preview',
      translationVersionIds: [],
      projectVersionIds: [],
      createdBy: createSystemActor(),
      activatedBy: null,
      activatedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    return {
      release: fallbackRelease,
      resume: resumeDocument,
      translations: translationRecords.filter(record => record.status === 'published' && !record.missing),
      projects: projectRecords.filter(record => record.status === 'published')
    }
  }
}

import type { ProjectLocaleContent, ProjectRecord, UserSession, WebLocale } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './client.js'
import { createSystemActor, resolveContentAuditFields } from './content-audit.js'
import { createContentVersionSnapshot, ensureSeedContentVersionSnapshot } from './content-versions.js'
import type { ProjectInsert, ProjectRow } from './schema/index.js'
import { projects } from './schema/index.js'

function createLocaleContent(locale: WebLocale, overrides?: Partial<ProjectLocaleContent>): ProjectLocaleContent {
  return {
    locale,
    title: overrides?.title ?? '',
    description: overrides?.description ?? '',
    summary: overrides?.summary ?? ''
  }
}

function createProjectRecord(input?: Partial<ProjectRecord>): ProjectRecord {
  const updatedAt = input?.updatedAt ?? new Date().toISOString()
  const systemActor = createSystemActor()
  const status = input?.status ?? 'draft'

  return {
    id: input?.id ?? `project_${crypto.randomUUID()}`,
    slug: input?.slug ?? '',
    status,
    sortOrder: input?.sortOrder ?? 0,
    cover: input?.cover ?? '',
    externalUrl: input?.externalUrl ?? '',
    tags: input?.tags ?? [],
    updatedBy: input?.updatedBy ?? systemActor,
    reviewedBy: input?.reviewedBy ?? (status === 'published' ? systemActor : null),
    publishedAt: input?.publishedAt ?? (status === 'published' ? updatedAt : null),
    updatedAt,
    locales: input?.locales ?? {
      'zh-CN': createLocaleContent('zh-CN'),
      'en-US': createLocaleContent('en-US')
    }
  }
}

const initialProjects: ProjectRecord[] = [
  createProjectRecord({
    id: 'project_resume_platform',
    slug: 'resume-platform',
    status: 'published',
    sortOrder: 1,
    cover: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://github.com/Fridolph/my-resume',
    tags: ['Nuxt 4', 'Monorepo', 'Nuxt UI'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'Resume Platform',
        description: 'Monorepo 个人内容平台，包含展示站与管理后台。',
        summary: '用于承载公开展示站、管理后台与多语言内容工作流。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'Resume Platform',
        description: 'A monorepo personal content platform with a public web app and admin console.',
        summary: 'Used to host the public web experience, admin workflows, and localized content.'
      })
    }
  }),
  createProjectRecord({
    id: 'project_design_system_draft',
    slug: 'design-system-draft',
    status: 'reviewing',
    sortOrder: 2,
    cover: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://dribbble.com',
    tags: ['Design Tokens', 'Reusable UI', 'SaaS'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'Design System Draft',
        description: '用于沉淀可复用组件、设计令牌和后台风格规范。',
        summary: '当前作为设计系统探索方向，后续可支撑公开站点与后台 UI 统一。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'Design System Draft',
        description: 'A reusable UI and design token draft for the platform.',
        summary: 'Reserved for consolidating reusable design primitives across the public site and admin console.'
      })
    }
  }),
  createProjectRecord({
    id: 'project_i18n_content_hub',
    slug: 'i18n-content-hub',
    status: 'draft',
    sortOrder: 3,
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://nuxt.com',
    tags: ['i18n', 'Content Workflow', 'Headless CMS'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'i18n Content Hub',
        description: '预留给翻译工作流、内容版本化与结构化文案管理。',
        summary: '当前用于验证文案、内容版本与项目详情如何协同管理。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'i18n Content Hub',
        description: 'A reserved direction for translation workflow and content management.',
        summary: 'Validates how translations, content versions, and project details can be managed together.'
      })
    }
  })
]

function fromRow(row: ProjectRow): ProjectRecord {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status as ProjectRecord['status'],
    sortOrder: row.sortOrder,
    cover: row.cover,
    externalUrl: row.externalUrl,
    tags: JSON.parse(row.tags) as string[],
    locales: JSON.parse(row.locales) as Record<WebLocale, ProjectLocaleContent>,
    updatedBy: row.updatedBy ? JSON.parse(row.updatedBy) : null,
    reviewedBy: row.reviewedBy ? JSON.parse(row.reviewedBy) : null,
    publishedAt: row.publishedAt ?? null,
    updatedAt: row.updatedAt
  }
}

function toRow(record: ProjectRecord): ProjectInsert {
  return {
    id: record.id,
    slug: record.slug,
    status: record.status,
    sortOrder: record.sortOrder,
    cover: record.cover,
    externalUrl: record.externalUrl,
    tags: JSON.stringify(record.tags),
    locales: JSON.stringify(record.locales),
    updatedBy: record.updatedBy ? JSON.stringify(record.updatedBy) : null,
    reviewedBy: record.reviewedBy ? JSON.stringify(record.reviewedBy) : null,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt
  }
}

async function normalizeProjectSortOrders(projectList: ProjectRecord[]) {
  const normalized = [...projectList]
    .sort((left, right) => left.sortOrder - right.sortOrder || left.updatedAt.localeCompare(right.updatedAt) || left.id.localeCompare(right.id))
    .map((project, index) => ({
      ...project,
      sortOrder: index + 1
    }))

  for (const project of normalized) {
    await db.update(projects)
      .set({ sortOrder: project.sortOrder, updatedAt: project.updatedAt })
      .where(eq(projects.id, project.id))
  }

  return normalized
}

export async function ensureProjectsSeed() {
  const existing = await db.select({ id: projects.id }).from(projects).limit(1)

  if (existing.length === 0) {
    await db.insert(projects).values(initialProjects.map(toRow))
  }

  for (const project of initialProjects) {
    await ensureSeedContentVersionSnapshot({
      moduleType: 'project',
      entityId: project.id,
      status: project.status,
      snapshot: project,
      createdBy: project.updatedBy,
      createdAt: project.updatedAt
    })
  }
}

export async function listProjects() {
  await ensureProjectsSeed()
  const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.updatedAt))
  const projectList = rows.map(fromRow)
  const hasDuplicateSortOrder = new Set(projectList.map(project => project.sortOrder)).size !== projectList.length
  const normalizedProjects = hasDuplicateSortOrder
    ? await normalizeProjectSortOrders(projectList)
    : projectList

  for (const project of normalizedProjects) {
    await ensureSeedContentVersionSnapshot({
      moduleType: 'project',
      entityId: project.id,
      status: project.status,
      snapshot: project,
      createdBy: project.updatedBy,
      createdAt: project.updatedAt
    })
  }

  return normalizedProjects
}

export async function createProject(record: Omit<ProjectRecord, 'updatedAt' | 'updatedBy' | 'reviewedBy' | 'publishedAt'>, actor: Pick<UserSession, 'id' | 'name' | 'email'>) {
  const timestamp = new Date().toISOString()
  const audit = resolveContentAuditFields({
    nextStatus: record.status,
    actor,
    timestamp
  })

  const nextRecord: ProjectRecord = {
    ...record,
    updatedBy: audit.updatedBy,
    reviewedBy: audit.reviewedBy,
    publishedAt: audit.publishedAt,
    updatedAt: timestamp
  }

  await db.insert(projects).values(toRow(nextRecord))
  await normalizeProjectSortOrders(await listProjects())
  const savedProject = (await listProjects()).find(project => project.id === nextRecord.id) ?? nextRecord

  await createContentVersionSnapshot({
    moduleType: 'project',
    entityId: savedProject.id,
    status: savedProject.status,
    changeType: 'create',
    snapshot: savedProject,
    createdBy: savedProject.updatedBy,
    createdAt: savedProject.updatedAt
  })

  return savedProject
}

export async function updateProject(projectId: string, record: Omit<ProjectRecord, 'updatedAt' | 'id' | 'updatedBy' | 'reviewedBy' | 'publishedAt'>, actor: Pick<UserSession, 'id' | 'name' | 'email'>, changeType: 'update' | 'restore' = 'update') {
  const currentProject = (await listProjects()).find(project => project.id === projectId)

  if (!currentProject) {
    throw new Error('Project not found')
  }

  const timestamp = new Date().toISOString()
  const audit = resolveContentAuditFields({
    currentStatus: currentProject.status,
    nextStatus: record.status,
    currentPublishedAt: currentProject.publishedAt,
    currentUpdatedBy: currentProject.updatedBy,
    currentReviewedBy: currentProject.reviewedBy,
    actor,
    timestamp
  })

  const nextRecord: ProjectRecord = {
    id: projectId,
    ...record,
    updatedBy: audit.updatedBy,
    reviewedBy: audit.reviewedBy,
    publishedAt: audit.publishedAt,
    updatedAt: timestamp
  }

  await db.update(projects)
    .set(toRow(nextRecord))
    .where(eq(projects.id, projectId))

  await normalizeProjectSortOrders(await listProjects())
  const savedProject = (await listProjects()).find(project => project.id === projectId) ?? nextRecord

  await createContentVersionSnapshot({
    moduleType: 'project',
    entityId: savedProject.id,
    status: savedProject.status,
    changeType,
    snapshot: savedProject,
    createdBy: savedProject.updatedBy,
    createdAt: savedProject.updatedAt
  })

  return savedProject
}

export async function deleteProject(projectId: string) {
  await db.delete(projects).where(eq(projects.id, projectId))
  await normalizeProjectSortOrders(await listProjects())
}


export async function restoreProjectVersion(record: ProjectRecord, actor: Pick<UserSession, 'id' | 'name' | 'email'>) {
  return await updateProject(record.id, {
    slug: record.slug,
    status: record.status,
    sortOrder: record.sortOrder,
    cover: record.cover,
    externalUrl: record.externalUrl,
    tags: record.tags,
    locales: record.locales
  }, actor, 'restore')
}

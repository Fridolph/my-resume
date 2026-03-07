import type { ProjectLocaleContent, ProjectRecord, PublishStatus, WebLocale } from '@repo/types'
import { asc, eq } from 'drizzle-orm'
import { db } from './client.js'
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
  return {
    id: input?.id ?? `project_${crypto.randomUUID()}`,
    slug: input?.slug ?? '',
    status: input?.status ?? 'draft',
    sortOrder: input?.sortOrder ?? 0,
    cover: input?.cover ?? '',
    externalUrl: input?.externalUrl ?? '',
    tags: input?.tags ?? [],
    updatedAt: input?.updatedAt ?? new Date().toISOString(),
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
        summary: '用于承载公开展示、后台管理和多语言内容工作流。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'Resume Platform',
        description: 'A monorepo content platform with a public site and admin console.',
        summary: 'Used to host the public web experience, admin workflows, and localized content.'
      })
    }
  }),
  createProjectRecord({
    id: 'project_design_system',
    slug: 'design-system-draft',
    status: 'reviewing',
    sortOrder: 2,
    cover: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://example.com/design-system',
    tags: ['Design Tokens', 'Reusable UI', 'Theme'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'Design System Draft',
        description: '预留 UI 设计系统沉淀方向。',
        summary: '用于验证设计系统说明、组件文档和视觉 token 的组织方式。'
      }),
      'en-US': createLocaleContent('en-US', {
        title: 'Design System Draft',
        description: 'A reserved direction for a design system and reusable UI documentation.',
        summary: 'Validates how tokens, reusable UI, and design-system notes can be managed.'
      })
    }
  }),
  createProjectRecord({
    id: 'project_i18n_hub',
    slug: 'i18n-content-hub',
    status: 'draft',
    sortOrder: 3,
    cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    externalUrl: 'https://example.com/i18n-hub',
    tags: ['i18n', 'CMS', 'Content Workflow'],
    locales: {
      'zh-CN': createLocaleContent('zh-CN', {
        title: 'i18n Content Hub',
        description: '预留文案与内容管理中心方向。',
        summary: '用于验证翻译结果、内容版本和项目详情的统一管理方式。'
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
    status: row.status as PublishStatus,
    sortOrder: row.sortOrder,
    cover: row.cover,
    externalUrl: row.externalUrl,
    tags: JSON.parse(row.tags) as string[],
    locales: JSON.parse(row.locales) as Record<WebLocale, ProjectLocaleContent>,
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
}

export async function listProjects() {
  await ensureProjectsSeed()
  const rows = await db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.updatedAt))
  const projectList = rows.map(fromRow)
  const hasDuplicateSortOrder = new Set(projectList.map(project => project.sortOrder)).size !== projectList.length

  if (hasDuplicateSortOrder) {
    return await normalizeProjectSortOrders(projectList)
  }

  return projectList
}

export async function createProject(record: Omit<ProjectRecord, 'updatedAt'>) {
  const nextRecord: ProjectRecord = {
    ...record,
    updatedAt: new Date().toISOString()
  }

  await db.insert(projects).values(toRow(nextRecord))
  await normalizeProjectSortOrders(await listProjects())
  return (await listProjects()).find(project => project.id === nextRecord.id) ?? nextRecord
}

export async function updateProject(projectId: string, record: Omit<ProjectRecord, 'updatedAt' | 'id'>) {
  const nextRecord: ProjectRecord = {
    id: projectId,
    ...record,
    updatedAt: new Date().toISOString()
  }

  await db.update(projects)
    .set(toRow(nextRecord))
    .where(eq(projects.id, projectId))

  await normalizeProjectSortOrders(await listProjects())
  return (await listProjects()).find(project => project.id === projectId) ?? nextRecord
}

export async function deleteProject(projectId: string) {
  await db.delete(projects).where(eq(projects.id, projectId))
  await normalizeProjectSortOrders(await listProjects())
}

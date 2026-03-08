import type {
  ResumeContactItem,
  ResumeDocument,
  ResumeEducationItem,
  ResumeExperienceItem,
  ResumeLocaleContent,
  ResumeSkillGroup,
  UserSession
} from '@repo/types'
import { eq } from 'drizzle-orm'
import { db } from './client.js'
import { createSystemActor, resolveContentAuditFields } from './content-audit.js'
import { createContentVersionSnapshot, ensureSeedContentVersionSnapshot } from './content-versions.js'
import type { ResumeDocumentInsert, ResumeDocumentRow } from './schema/index.js'
import { resumeDocuments } from './schema/index.js'

function createEducationItem(input?: Partial<ResumeEducationItem>): ResumeEducationItem {
  return {
    id: input?.id ?? `edu_${crypto.randomUUID()}`,
    school: input?.school ?? '',
    degree: input?.degree ?? '',
    period: input?.period ?? '',
    summary: input?.summary ?? ''
  }
}

function createExperienceItem(input?: Partial<ResumeExperienceItem>): ResumeExperienceItem {
  return {
    id: input?.id ?? `exp_${crypto.randomUUID()}`,
    company: input?.company ?? '',
    role: input?.role ?? '',
    period: input?.period ?? '',
    summary: input?.summary ?? ''
  }
}

function createSkillGroup(input?: Partial<ResumeSkillGroup>): ResumeSkillGroup {
  return {
    id: input?.id ?? `skill_${crypto.randomUUID()}`,
    title: input?.title ?? '',
    items: input?.items ?? []
  }
}

function createContactItem(input?: Partial<ResumeContactItem>): ResumeContactItem {
  return {
    id: input?.id ?? `contact_${crypto.randomUUID()}`,
    label: input?.label ?? '',
    value: input?.value ?? '',
    href: input?.href ?? ''
  }
}

const defaultResumeDocument: ResumeDocument = {
  id: 'resume_main',
  status: 'draft',
  updatedBy: createSystemActor(),
  reviewedBy: null,
  publishedAt: null,
  updatedAt: new Date().toISOString(),
  locales: {
    'zh-CN': {
      locale: 'zh-CN',
      baseInfo: {
        fullName: 'Fridolph',
        headline: '高级前端工程师 / Nuxt 全栈方向',
        location: '中国 · 上海',
        summary: '负责个人内容平台的前端架构、后台管理与多语言内容体系建设。'
      },
      education: [
        createEducationItem({
          id: 'edu_zh_1',
          school: '某某大学',
          degree: '计算机科学与技术',
          period: '2016 - 2020',
          summary: '系统学习前端工程、软件工程与数据结构。'
        })
      ],
      experiences: [
        createExperienceItem({
          id: 'exp_zh_1',
          company: '某科技公司',
          role: '前端工程师',
          period: '2020 - 至今',
          summary: '负责 Nuxt / Vue 应用架构、组件体系与工程化建设。'
        })
      ],
      skillGroups: [
        createSkillGroup({
          id: 'skill_zh_1',
          title: '核心技术',
          items: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Node.js']
        }),
        createSkillGroup({
          id: 'skill_zh_2',
          title: '工程能力',
          items: ['Monorepo', '设计系统', '性能优化', 'CI/CD']
        })
      ],
      contacts: [
        createContactItem({
          id: 'contact_zh_1',
          label: '邮箱',
          value: 'hello@fridolph.com',
          href: 'mailto:hello@fridolph.com'
        }),
        createContactItem({
          id: 'contact_zh_2',
          label: 'GitHub',
          value: 'github.com/Fridolph',
          href: 'https://github.com/Fridolph'
        })
      ]
    },
    'en-US': {
      locale: 'en-US',
      baseInfo: {
        fullName: 'Fridolph',
        headline: 'Senior Frontend Engineer / Nuxt Full-stack Track',
        location: 'Shanghai, China',
        summary: 'Building the public content site, admin console, and localized content workflow for the personal platform.'
      },
      education: [
        createEducationItem({
          id: 'edu_en_1',
          school: 'Example University',
          degree: 'B.Sc. in Computer Science',
          period: '2016 - 2020',
          summary: 'Focused on frontend engineering, software engineering, and core computer science concepts.'
        })
      ],
      experiences: [
        createExperienceItem({
          id: 'exp_en_1',
          company: 'Example Tech',
          role: 'Frontend Engineer',
          period: '2020 - Present',
          summary: 'Worked on Nuxt / Vue architecture, reusable components, and engineering workflows.'
        })
      ],
      skillGroups: [
        createSkillGroup({
          id: 'skill_en_1',
          title: 'Core Stack',
          items: ['Vue 3', 'Nuxt 4', 'TypeScript', 'Node.js']
        }),
        createSkillGroup({
          id: 'skill_en_2',
          title: 'Engineering',
          items: ['Monorepo', 'Design System', 'Performance', 'CI/CD']
        })
      ],
      contacts: [
        createContactItem({
          id: 'contact_en_1',
          label: 'Email',
          value: 'hello@fridolph.com',
          href: 'mailto:hello@fridolph.com'
        }),
        createContactItem({
          id: 'contact_en_2',
          label: 'GitHub',
          value: 'github.com/Fridolph',
          href: 'https://github.com/Fridolph'
        })
      ]
    }
  }
}

function fromRow(row: ResumeDocumentRow): ResumeDocument {
  return {
    id: row.id,
    status: row.status as ResumeDocument['status'],
    locales: JSON.parse(row.locales) as Record<'zh-CN' | 'en-US', ResumeLocaleContent>,
    updatedBy: row.updatedBy ? JSON.parse(row.updatedBy) : null,
    reviewedBy: row.reviewedBy ? JSON.parse(row.reviewedBy) : null,
    publishedAt: row.publishedAt ?? null,
    updatedAt: row.updatedAt
  }
}

function toRow(record: ResumeDocument): ResumeDocumentInsert {
  return {
    id: record.id,
    status: record.status,
    locales: JSON.stringify(record.locales),
    updatedBy: record.updatedBy ? JSON.stringify(record.updatedBy) : null,
    reviewedBy: record.reviewedBy ? JSON.stringify(record.reviewedBy) : null,
    publishedAt: record.publishedAt,
    updatedAt: record.updatedAt
  }
}

export async function ensureResumeDocumentSeed() {
  const existing = await db.select({ id: resumeDocuments.id })
    .from(resumeDocuments)
    .where(eq(resumeDocuments.id, defaultResumeDocument.id))
    .limit(1)

  if (existing.length === 0) {
    await db.insert(resumeDocuments).values(toRow(defaultResumeDocument))
  }

  await ensureSeedContentVersionSnapshot({
    moduleType: 'resume',
    entityId: defaultResumeDocument.id,
    status: defaultResumeDocument.status,
    snapshot: defaultResumeDocument,
    createdBy: defaultResumeDocument.updatedBy,
    createdAt: defaultResumeDocument.updatedAt
  })
}

export async function getResumeDocument() {
  await ensureResumeDocumentSeed()

  const [row] = await db.select()
    .from(resumeDocuments)
    .where(eq(resumeDocuments.id, defaultResumeDocument.id))
    .limit(1)

  const document = row ? fromRow(row) : defaultResumeDocument

  await ensureSeedContentVersionSnapshot({
    moduleType: 'resume',
    entityId: document.id,
    status: document.status,
    snapshot: document,
    createdBy: document.updatedBy,
    createdAt: document.updatedAt
  })

  return document
}

export async function updateResumeDocument(record: ResumeDocument, actor: Pick<UserSession, 'id' | 'name' | 'email'>) {
  const currentDocument = await getResumeDocument()
  const timestamp = new Date().toISOString()
  const audit = resolveContentAuditFields({
    currentStatus: currentDocument.status,
    nextStatus: record.status,
    currentPublishedAt: currentDocument.publishedAt,
    currentUpdatedBy: currentDocument.updatedBy,
    currentReviewedBy: currentDocument.reviewedBy,
    actor,
    timestamp
  })

  const nextRecord: ResumeDocument = {
    ...record,
    updatedBy: audit.updatedBy,
    reviewedBy: audit.reviewedBy,
    publishedAt: audit.publishedAt,
    updatedAt: timestamp
  }

  const row = toRow(nextRecord)

  await db.insert(resumeDocuments)
    .values(row)
    .onConflictDoUpdate({
      target: resumeDocuments.id,
      set: {
        status: row.status,
        locales: row.locales,
        updatedBy: row.updatedBy,
        reviewedBy: row.reviewedBy,
        publishedAt: row.publishedAt,
        updatedAt: row.updatedAt
      }
    })

  await createContentVersionSnapshot({
    moduleType: 'resume',
    entityId: nextRecord.id,
    status: nextRecord.status,
    changeType: 'update',
    snapshot: nextRecord,
    createdBy: nextRecord.updatedBy,
    createdAt: nextRecord.updatedAt
  })

  return nextRecord
}

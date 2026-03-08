import type {
  ContentActorSummary,
  ContentModuleType,
  ContentVersionChangeType,
  ContentVersionRecord,
  ProjectRecord,
  PublishStatus,
  ResumeDocument,
  TranslationRecord
} from '@repo/types'
import { and, desc, eq } from 'drizzle-orm'
import { db } from './client.js'
import type { ContentVersionInsert, ContentVersionRow } from './schema/index.js'
import { contentVersions } from './schema/index.js'

interface ContentSnapshotMap {
  translation: TranslationRecord
  resume: ResumeDocument
  project: ProjectRecord
}

export interface CreateContentVersionInput<TModuleType extends ContentModuleType> {
  moduleType: TModuleType
  entityId: string
  status: PublishStatus
  changeType: ContentVersionChangeType
  snapshot: ContentSnapshotMap[TModuleType]
  createdBy: ContentActorSummary | null
  createdAt: string
}

function fromRow<TModuleType extends ContentModuleType>(row: ContentVersionRow): ContentVersionRecord<ContentSnapshotMap[TModuleType]> {
  return {
    id: row.id,
    moduleType: row.moduleType as TModuleType,
    entityId: row.entityId,
    version: row.version,
    status: row.status as PublishStatus,
    changeType: row.changeType as ContentVersionChangeType,
    snapshot: JSON.parse(row.snapshot) as ContentSnapshotMap[TModuleType],
    createdBy: row.createdBy ? JSON.parse(row.createdBy) as ContentActorSummary : null,
    createdAt: row.createdAt
  }
}

function toRow<TModuleType extends ContentModuleType>(
  input: CreateContentVersionInput<TModuleType> & { id: string, version: number }
): ContentVersionInsert {
  return {
    id: input.id,
    moduleType: input.moduleType,
    entityId: input.entityId,
    version: input.version,
    status: input.status,
    changeType: input.changeType,
    snapshot: JSON.stringify(input.snapshot),
    createdBy: input.createdBy ? JSON.stringify(input.createdBy) : null,
    createdAt: input.createdAt
  }
}

async function getNextContentVersion(moduleType: ContentModuleType, entityId: string) {
  const [latestVersion] = await db.select({ version: contentVersions.version })
    .from(contentVersions)
    .where(and(eq(contentVersions.moduleType, moduleType), eq(contentVersions.entityId, entityId)))
    .orderBy(desc(contentVersions.version))
    .limit(1)

  return (latestVersion?.version ?? 0) + 1
}

export async function createContentVersionSnapshot<TModuleType extends ContentModuleType>(input: CreateContentVersionInput<TModuleType>) {
  const version = await getNextContentVersion(input.moduleType, input.entityId)
  const nextRecord = {
    ...input,
    id: `${input.moduleType}_${input.entityId}_v${version}`,
    version
  }

  await db.insert(contentVersions).values(toRow(nextRecord))
  return nextRecord
}

export async function ensureSeedContentVersionSnapshot<TModuleType extends ContentModuleType>(input: Omit<CreateContentVersionInput<TModuleType>, 'changeType'>) {
  const [existing] = await db.select({ id: contentVersions.id })
    .from(contentVersions)
    .where(and(eq(contentVersions.moduleType, input.moduleType), eq(contentVersions.entityId, input.entityId)))
    .limit(1)

  if (existing) {
    return null
  }

  return await createContentVersionSnapshot({
    ...input,
    changeType: 'seed'
  })
}

export async function listContentVersions<TModuleType extends ContentModuleType>(moduleType: TModuleType, entityId: string) {
  const rows = await db.select()
    .from(contentVersions)
    .where(and(eq(contentVersions.moduleType, moduleType), eq(contentVersions.entityId, entityId)))
    .orderBy(desc(contentVersions.version), desc(contentVersions.createdAt))

  return rows.map(row => fromRow<TModuleType>(row))
}


export async function getContentVersionById<TModuleType extends ContentModuleType>(versionId: string) {
  const [row] = await db.select()
    .from(contentVersions)
    .where(eq(contentVersions.id, versionId))
    .limit(1)

  return row ? fromRow<TModuleType>(row) : null
}

import type { RagChunk } from './rag.types'

export const RAG_KNOWLEDGE_DOMAINS = [
  'resume_core',
  'projects',
  'experience',
  'skills',
  'hobbies',
  'writing_media',
] as const

export type RagKnowledgeDomain = typeof RAG_KNOWLEDGE_DOMAINS[number]

export type RagContentType =
  | 'profile'
  | 'project'
  | 'experience'
  | 'skills'
  | 'education'
  | 'strength'
  | 'hobby'
  | 'tech_blog'
  | 'knowledge_column'
  | 'general'

export type RagSourceCollection = 'resume' | 'knowledge' | 'user_docs'

export type RagRenderHint =
  | 'text'
  | 'project_card'
  | 'experience_card'
  | 'hobby_card'
  | 'article_card'

const RAG_RENDER_HINTS: readonly RagRenderHint[] = [
  'text',
  'project_card',
  'experience_card',
  'hobby_card',
  'article_card',
]

export interface RagKnowledgeMetadata {
  knowledgeDomain: RagKnowledgeDomain
  contentType: RagContentType
  sourceCollection: RagSourceCollection
  renderHint: RagRenderHint
}

export function isRagKnowledgeDomain(value: unknown): value is RagKnowledgeDomain {
  return typeof value === 'string' && RAG_KNOWLEDGE_DOMAINS.includes(value as RagKnowledgeDomain)
}

export function isRagRenderHint(value: unknown): value is RagRenderHint {
  return typeof value === 'string' && RAG_RENDER_HINTS.includes(value as RagRenderHint)
}

export function normalizeRagKnowledgeDomains(
  domains: readonly unknown[] | undefined,
): RagKnowledgeDomain[] | undefined {
  if (!domains || domains.length === 0) {
    return undefined
  }

  const normalized = domains.filter(isRagKnowledgeDomain)

  if (normalized.length === 0) {
    return undefined
  }

  return Array.from(new Set<RagKnowledgeDomain>(normalized))
}

export function resolveKnowledgeDomainFromContentType(
  contentType: string | undefined,
): RagKnowledgeDomain {
  if (contentType === 'hobby') return 'hobbies'
  if (contentType === 'tech_blog' || contentType === 'knowledge_column') return 'writing_media'
  if (contentType === 'project') return 'projects'
  if (contentType === 'experience') return 'experience'
  if (contentType === 'skills') return 'skills'

  return 'writing_media'
}

export function resolveRenderHintFromMetadata(input: {
  contentType?: string
  knowledgeDomain: RagKnowledgeDomain
}): RagRenderHint {
  if (input.contentType === 'hobby' || input.knowledgeDomain === 'hobbies') return 'hobby_card'
  if (
    input.contentType === 'tech_blog' ||
    input.contentType === 'knowledge_column' ||
    input.contentType === 'general' ||
    input.knowledgeDomain === 'writing_media'
  ) return 'article_card'
  if (input.knowledgeDomain === 'projects') return 'project_card'
  if (input.knowledgeDomain === 'experience') return 'experience_card'

  return 'text'
}

export function buildUserDocsKnowledgeMetadata(contentType = 'general'): RagKnowledgeMetadata {
  const knowledgeDomain = resolveKnowledgeDomainFromContentType(contentType)

  return {
    knowledgeDomain,
    contentType: normalizeRagContentType(contentType),
    sourceCollection: 'user_docs',
    renderHint: resolveRenderHintFromMetadata({ contentType, knowledgeDomain }),
  }
}

export function normalizeRagContentType(value: string | undefined): RagContentType {
  if (value === 'article') return 'tech_blog'
  if (value === 'media') return 'knowledge_column'

  if (
    value === 'profile' ||
    value === 'project' ||
    value === 'experience' ||
    value === 'skills' ||
    value === 'education' ||
    value === 'strength' ||
    value === 'hobby' ||
    value === 'tech_blog' ||
    value === 'knowledge_column' ||
    value === 'general'
  ) {
    return value
  }

  return 'general'
}

export function resolveRagChunkKnowledgeMetadata(chunk: RagChunk): RagKnowledgeMetadata {
  const explicitDomain = isRagKnowledgeDomain(chunk.knowledgeDomain)
    ? chunk.knowledgeDomain
    : undefined
  const contentType = normalizeRagContentType(chunk.contentType ?? inferContentTypeFromSection(chunk.section, chunk.title))
  const sourceCollection = resolveSourceCollection(chunk.sourceType)
  const knowledgeDomain = explicitDomain ?? inferKnowledgeDomainFromChunk(chunk, contentType)

  return {
    knowledgeDomain,
    contentType,
    sourceCollection,
    renderHint: chunk.renderHint ?? resolveRenderHintFromMetadata({ contentType, knowledgeDomain }),
  }
}

export function withResolvedRagChunkKnowledgeMetadata(chunk: RagChunk): RagChunk {
  return {
    ...chunk,
    ...resolveRagChunkKnowledgeMetadata(chunk),
  }
}

export function doesRagChunkMatchKnowledgeDomains(
  chunk: RagChunk,
  domains: readonly RagKnowledgeDomain[] | undefined,
): boolean {
  if (!domains || domains.length === 0) {
    return true
  }

  const metadata = resolveRagChunkKnowledgeMetadata(chunk)
  return domains.includes(metadata.knowledgeDomain)
}

function resolveSourceCollection(sourceType: RagChunk['sourceType']): RagSourceCollection {
  if (sourceType === 'knowledge') return 'knowledge'
  if (sourceType === 'user_docs') return 'user_docs'

  return 'resume'
}

function inferContentTypeFromSection(section: string, title: string): RagContentType {
  if (section === 'project') return 'project'
  if (section === 'experience') return 'experience'
  if (section === 'skills') return 'skills'
  if (section === 'education') return 'education'
  if (section === 'strengths') return 'strength'
  if (section === 'profile' || section === 'resume') return 'profile'
  if (section === 'knowledge') return 'tech_blog'
  if (section === 'extra' && title.includes('文章')) return 'tech_blog'

  return 'general'
}

function inferKnowledgeDomainFromChunk(
  chunk: RagChunk,
  contentType: RagContentType,
): RagKnowledgeDomain {
  if (chunk.sourceType === 'knowledge') return 'writing_media'
  if (chunk.sourceType === 'user_docs') return resolveKnowledgeDomainFromContentType(contentType)
  if (contentType === 'project') return 'projects'
  if (contentType === 'experience') return 'experience'
  if (contentType === 'skills') return 'skills'
  if (contentType === 'hobby') return 'hobbies'
  if (contentType === 'tech_blog' || contentType === 'knowledge_column' || contentType === 'general') return 'writing_media'

  return 'resume_core'
}

/**
 * 检索态知识来源大类（用于数据库契约层）
 *
 * 说明：
 * - resume_core: 简历核心事实，回答优先级更高
 * - user_docs: 用户补充资料，如博客、技术文章、兴趣类内容
 */
export type RagRetrievalSourceType = 'resume_core' | 'user_docs'

/**
 * 检索态知识作用域（用于版本对齐）
 *
 * 说明：
 * - draft: 对应编辑中的草稿内容
 * - published: 对应已发布快照内容
 */
export type RagRetrievalSourceScope = 'draft' | 'published'

/**
 * 将旧索引 sourceType 映射到检索态契约 sourceType。
 *
 * 当前历史索引中：
 * - resume -> resume_core
 * - knowledge -> user_docs
 *
 * @param sourceType 旧索引来源类型
 * @returns 检索态来源类型
 */
export function mapLegacySourceTypeToRetrievalSourceType(
  sourceType: RagChunk['sourceType'],
): RagRetrievalSourceType {
  if (sourceType === 'knowledge' || sourceType === 'user_docs') {
    return 'user_docs'
  }

  return 'resume_core'
}

/**
 * 教育条目源模型（RAG 切块前输入）。
 */
export interface RagSourceEducationItem {
  id: string
  school: string
  degree: string
  major: string
  period: string
  location: string
  details?: string[]
}

/**
 * 工作经历内的项目条目源模型（RAG 切块前输入）。
 */
export interface RagSourceExperienceProjectItem {
  id: string
  name: string
  summary: string
  coreFunctions?: string
  techStack?: string[]
  contributions?: string[]
}

/**
 * 工作经历条目源模型（RAG 切块前输入）。
 */
export interface RagSourceExperienceItem {
  id: string
  company: string
  role: string
  period: string
  summary: string
  responsibilities?: string[]
  achievements?: string[]
  techStack?: string[]
  projects?: RagSourceExperienceProjectItem[]
}

/**
 * 独立项目条目源模型（RAG 切块前输入）。
 */
export interface RagSourceStandaloneProjectItem {
  id: string
  name: string
  role: string
  period: string
  summary: string
  coreFunctions?: string
  techStack?: string[]
  contributions?: string[]
}

/**
 * 简历知识源文档模型（RAG 切块前输入）。
 */
export interface RagSourceDocument {
  profile: {
    name: string
    title: string
    location: string
    experienceYears: string
    targetRole: string
    status: string
    summary: string
    links?: Array<{
      label: string
      url: string
    }>
  }
  strengths?: string[]
  skills: string[]
  education: RagSourceEducationItem[]
  experiences: RagSourceExperienceItem[]
  projects: RagSourceStandaloneProjectItem[]
  extras?: {
    openSource?: string[]
    articles?: string[]
  }
}

/**
 * RAG 语义块（未向量化）。
 *
 * sourceType 兼容值：
 * - 历史值：resume / knowledge
 * - 新契约：resume_core / user_docs
 */
export interface RagChunk {
  id: string
  title: string
  section: string
  content: string
  sourceType?: 'resume' | 'knowledge' | RagRetrievalSourceType
  sourcePath?: string
}

/**
 * 已向量化的 RAG 语义块。
 */
export interface RagIndexedChunk extends RagChunk {
  embedding: number[]
}

/**
 * 本地索引文件结构（文件态索引模型）。
 */
export interface RagIndexFile {
  sourcePath: string
  blogDirectoryPath: string
  generatedAt: string
  chunkCount: number
  sourceHash: string
  knowledgeHash: string
  providerSummary?: {
    provider: string
    model: string
    mode: string
    chatModel?: string
    embeddingModel?: string
  }
  chunks: RagIndexedChunk[]
}

/**
 * 检索命中结果模型（用于 search/ask 返回）。
 */
export interface RagSearchMatch extends RagChunk {
  score: number
}

/**
 * RAG 问答引用条目。
 *
 * citations 是 #180 的核心返回契约：即使模型回答文本不可完全信任，
 * 前端也能用它展示“这句话来自哪些检索片段”。
 */
export interface RagAskCitation {
  /** 面向回答文本的引用序号，例如 #1。 */
  ref: string
  /** 命中 chunk ID，用于追溯具体片段。 */
  id: string
  /** 来源标题或文件名。 */
  title: string
  /** 来源分区，如 experiences / projects / user_docs。 */
  section: string
  /** 统一后的来源类型。 */
  sourceType: RagRetrievalSourceType
  /** 可选来源路径或文件名。 */
  sourcePath?: string
  /** 检索分数。 */
  score: number
  /** 短摘录，供前端引用卡片展示。 */
  snippet: string
}

/**
 * RAG 问答返回结构。
 */
export interface RagAskResult {
  answer: string
  citations: RagAskCitation[]
  matches: RagSearchMatch[]
  providerSummary: RagIndexFile['providerSummary']
}

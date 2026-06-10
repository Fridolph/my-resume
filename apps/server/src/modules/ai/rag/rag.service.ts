import { Inject, Injectable, Logger } from '@nestjs/common'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import { RagSourceScope } from '../../../database/schema'
import { AiService } from '../ai.service'
import { RagChunkService } from './rag-chunk.service'
import { RagIndexRepository } from './rag-index.repository'
import { RagKnowledgeService } from './rag-knowledge.service'
import { RagRetrievalRepository } from './rag-retrieval.repository'
import {
  mergeRagSearchRoutingConfig,
  RagSearchRoutingOverride,
  resolveRagSearchRoutingConfig,
} from './rag-search-routing'
import {
  applyRagSearchQualityGate,
  RagSearchQualityGate,
  resolveRagSearchQualityGate,
} from './rag-search-quality'
import {
  buildLocalRagSearchContext,
  calculateKeywordScore,
  cosineSimilarity,
} from './rag-search-context-builder'
import { applyRagSearchRerank, detectRagSearchQuestionStrategy, rerankRagSearchMatches } from './rag-search-rerank'
import { DEFAULT_RAG_SEARCH_RERANK_CONFIG } from './config/rag-search-rerank.config'
import {
  doesRagChunkMatchKnowledgeDomains,
  isRagKnowledgeDomain,
  isRagRenderHint,
  normalizeRagContentType,
  normalizeRagKnowledgeDomains,
  resolveRagChunkKnowledgeMetadata,
  type RagKnowledgeDomain,
  type RagSourceCollection,
} from './rag-knowledge-domain'
import {
  mapLegacySourceTypeToRetrievalSourceType,
  RagAskCitation,
  RagAskResult,
  RagIndexFile,
  RagRichCardMedia,
  RagRichCardMetadata,
  RagRetrievalSourceType,
  RagSearchMatch,
} from './rag.types'
import { buildRagAskPrompt, buildRagAskSystemPrompt } from './prompts/rag-ask.prompt'
import { RAG_VECTOR_STORE } from './vector-store/tokens'
import type { RagVectorSearchMatch, RagVectorStore } from './vector-store/types'

function computeContentHash(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function computeKnowledgeDirectoryHash(directoryPath: string): string {
  if (!existsSync(directoryPath)) {
    return computeContentHash('')
  }

  const markdownFiles = readdirSync(directoryPath)
    .filter((fileName) => fileName.endsWith('.md'))
    .sort((left, right) => left.localeCompare(right, 'zh-Hans-CN'))

  const fingerprint = markdownFiles
    .map((fileName) => {
      const content = readFileSync(join(directoryPath, fileName), 'utf8')

      return `FILE:${fileName}\n${content}`
    })
    .join('\n\n====\n\n')

  return computeContentHash(fingerprint)
}

function getRagSourcePriority(sourceType: RagRetrievalSourceType): number {
  return sourceType === 'resume_core' ? 0 : 1
}

function normalizeRagCitationSourceType(
  sourceType: RagSearchMatch['sourceType'],
): RagRetrievalSourceType {
  return mapLegacySourceTypeToRetrievalSourceType(sourceType ?? 'resume')
}

function buildCitationSnippet(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim()

  return normalized.length > 180 ? `${normalized.slice(0, 180)}...` : normalized
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readOptionalStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const normalized = value
    .map((item) => readOptionalString(item))
    .filter((item): item is string => Boolean(item))

  return normalized.length > 0 ? normalized : undefined
}

function normalizeRichCardMedia(value: unknown): RagRichCardMedia[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const media = value
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }

      const record = item as Record<string, unknown>
      const type = record.type
      const url = readOptionalString(record.url)

      if (
        (type !== 'image' && type !== 'video' && type !== 'link') ||
        !url
      ) {
        return null
      }

      return {
        type,
        url,
        ...(readOptionalString(record.title)
          ? { title: readOptionalString(record.title) }
          : {}),
        ...(readOptionalString(record.thumbnailUrl)
          ? { thumbnailUrl: readOptionalString(record.thumbnailUrl) }
          : {}),
      } satisfies RagRichCardMedia
    })
    .filter((item): item is RagRichCardMedia => Boolean(item))

  return media.length > 0 ? media : undefined
}

function normalizeRichCardMetadata(value: unknown): RagRichCardMetadata | undefined {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const record = value as Record<string, unknown>
  const richCard: RagRichCardMetadata = {
    title: readOptionalString(record.title),
    description: readOptionalString(record.description),
    url: readOptionalString(record.url),
    imageUrl: readOptionalString(record.imageUrl),
    thumbnailUrl: readOptionalString(record.thumbnailUrl),
    publishedAt: readOptionalString(record.publishedAt),
    keywords: readOptionalStringArray(record.keywords),
    media: normalizeRichCardMedia(record.media),
  }

  return Object.values(richCard).some((item) => item !== undefined)
    ? richCard
    : undefined
}

function resolveRichCardMetadata(
  metadata: Record<string, unknown> | null,
  documentMetadata: Record<string, unknown> | null = null,
): RagRichCardMetadata | undefined {
  return normalizeRichCardMetadata(metadata?.richCard) ??
    normalizeRichCardMetadata(documentMetadata?.richCard)
}

export function sortMatchesForAnswer(matches: RagSearchMatch[]): RagSearchMatch[] {
  return [...matches].sort((left, right) => {
    const leftPriority = getRagSourcePriority(
      normalizeRagCitationSourceType(left.sourceType),
    )
    const rightPriority = getRagSourcePriority(
      normalizeRagCitationSourceType(right.sourceType),
    )

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority
    }

    return right.score - left.score
  })
}

/**
 * 对问答场景的检索结果做语言对齐过滤。
 *
 * chunk 元数据中 locale 与问题语言不一致时丢弃，避免英文 chunk
 * 混入中文回答。分数交给 search 的 quality gate 统一处理。
 */
function filterMatchesForAskByLocale(matches: RagSearchMatch[], questionLocale: string): RagSearchMatch[] {
  const filtered: RagSearchMatch[] = []

  for (const match of matches) {
    const metadata = (match as unknown as Record<string, unknown>).metadataJson ?? (match as unknown as Record<string, unknown>).metadata
    if (metadata && typeof metadata === 'object') {
      const chunkLocale = (metadata as Record<string, unknown>).locale
      if (typeof chunkLocale === 'string' && chunkLocale && chunkLocale !== questionLocale) {
        continue
      }
    }

    filtered.push(match)
  }

  return filtered
}

function buildRagAskCitations(matches: RagSearchMatch[]): RagAskCitation[] {
  return matches.map((item, index) => ({
    ref: `#${index + 1}`,
    id: item.id,
    title: item.title,
    section: item.section,
    sourceType: normalizeRagCitationSourceType(item.sourceType),
    sourcePath: item.sourcePath,
    score: item.score,
    snippet: buildCitationSnippet(item.content),
    tags: item.tags,
    contentType: (item as any)?.contentType as string | undefined,
    knowledgeDomain: item.knowledgeDomain,
    renderHint: item.renderHint,
    richCard: item.richCard,
  }))
}

function buildInsufficientContextAnswer(locale: 'zh' | 'en'): string {
  return locale === 'en'
    ? "I don't have enough information in my resume to answer this question accurately. Feel free to ask about my projects, work experience, or technical skills!"
    : '我的简历中暂时没有足够的信息来准确回答这个问题。欢迎问我关于项目经历、工作经历或技术技能的问题！'
}

/**
 * 输入安全检测。
 *
 * 只拦截辱骂/恶意内容，其余（打招呼/短句/负面情绪等）放行至 LLM 层做自然回复。
 */
function detectRedirect(
  question: string,
  locale: 'zh' | 'en',
): string | null {
  const lower = question.trim().toLowerCase()

  const abusePatterns = [
    '傻逼', 'sb', '傻狗', '废物', '垃圾', '滚', '去死', 'cnm', '操你', '草你',
    '你妈', '他妈', '日你', '脑残', '弱智', '白痴',
    'fuck', 'shit', 'damn', 'bitch', 'asshole', 'stupid', 'idiot', 'moron',
    '烦死了', '太烂了', '什么垃圾', '真没用', '一点用没有',
  ]

  if (abusePatterns.some((pattern) => lower.includes(pattern))) {
    return locale === 'en'
      ? "I'm here to talk about my professional background, skills, and projects. If you have a question about my resume, feel free to ask in a constructive way — I'd love to share!"
      : '我是来分享专业经历的。如果你对我的简历、项目或技能有问题，欢迎以建设性的方式提问——我很乐意交流！'
  }

  return null
}

function normalizeUnknownErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name)
  private readonly defaultSearchQualityGate: RagSearchQualityGate =
    resolveRagSearchQualityGate(process.env)
  private readonly searchRoutingConfig = resolveRagSearchRoutingConfig(process.env)
  private vectorStoreAvailable: boolean | null = null
  private lastVectorStoreError: string | null = null

  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(RagChunkService)
    private readonly ragChunkService: RagChunkService,
    @Inject(RagKnowledgeService)
    private readonly ragKnowledgeService: RagKnowledgeService,
    @Inject(RagIndexRepository)
    private readonly ragIndexRepository: RagIndexRepository,
    @Inject(RagRetrievalRepository)
    private readonly ragRetrievalRepository: RagRetrievalRepository,
    @Inject(RAG_VECTOR_STORE)
    private readonly ragVectorStore: RagVectorStore,
  ) {}

  /**
   * 返回索引可用性、过期状态与构建摘要
   * @returns RAG 运行状态
   */
  getStatus() {
    // status 用于判断是否已建索引、是否 stale、以及索引构建时的 provider 摘要。
    const { sourcePath, blogDirectoryPath, indexPath } =
      this.ragIndexRepository.getPaths()
    const index = this.ragIndexRepository.readIndex()
    const providerSummary = this.aiService.getProviderSummary()
    const currentSourceHash = computeContentHash(readFileSync(sourcePath, 'utf8'))
    const currentKnowledgeHash = computeKnowledgeDirectoryHash(blogDirectoryPath)
    const stale = !index
      ? true
      : index.sourceHash !== currentSourceHash ||
        index.knowledgeHash !== currentKnowledgeHash
    const vectorStoreEnabled =
      this.ragVectorStore.backend !== 'local' && this.searchRoutingConfig.useVectorStore
    const effectiveSearchMode =
      !vectorStoreEnabled
        ? 'local'
        : this.searchRoutingConfig.fallbackToLocal
          ? 'vector_with_local_fallback'
          : 'vector'

    return {
      sourcePath,
      blogDirectoryPath,
      indexPath,
      providerSummary,
      indexed: Boolean(index),
      stale,
      chunkCount: index?.chunkCount ?? 0,
      resumeChunkCount:
        index?.chunks.filter((item) => item.sourceType !== 'knowledge').length ?? 0,
      knowledgeChunkCount:
        index?.chunks.filter((item) => item.sourceType === 'knowledge').length ?? 0,
      generatedAt: index?.generatedAt ?? null,
      currentSourceHash,
      currentKnowledgeHash,
      configuredVectorBackend: this.ragVectorStore.backend,
      vectorStoreEnabled,
      vectorStoreAvailable:
        this.ragVectorStore.backend === 'local' ? null : this.vectorStoreAvailable,
      effectiveSearchMode,
      lastVectorStoreError: this.lastVectorStoreError,
      indexedSourceHash: index?.sourceHash ?? null,
      indexedKnowledgeHash: index?.knowledgeHash ?? null,
      indexedProviderSummary: index?.providerSummary ?? null,
    }
  }

  /**
   * 从简历源与知识源重建完整 RAG 索引
   * @returns 重建后的状态摘要
   */
  async rebuildIndex() {
    // rebuild 主流程：读取源内容 -> 切语义块 -> 向量化 -> 写索引文件。
    const { sourcePath, blogDirectoryPath } = this.ragIndexRepository.getPaths()
    const source = readFileSync(sourcePath, 'utf8')
    const sourceHash = computeContentHash(source)
    const knowledgeHash = computeKnowledgeDirectoryHash(blogDirectoryPath)
    const document = this.ragChunkService.parseSource(source)
    const chunks = [
      ...this.ragChunkService.buildChunks(document),
      ...this.ragKnowledgeService.buildArticleChunksFromDirectory(blogDirectoryPath),
    ]
    const embeddingResult = await this.aiService.embedTexts({
      texts: chunks.map((item) => item.content),
    })
    const providerSummary = this.aiService.getProviderSummary()

    const index: RagIndexFile = {
      sourcePath,
      blogDirectoryPath,
      generatedAt: new Date().toISOString(),
      chunkCount: chunks.length,
      sourceHash,
      knowledgeHash,
      providerSummary,
      chunks: chunks.map((chunk, indexPosition) => ({
        ...chunk,
        embedding: embeddingResult.embeddings[indexPosition] ?? [],
      })),
    }

    this.ragIndexRepository.writeIndex(index)

    return {
      ...this.getStatus(),
    }
  }

  /**
   * 执行混合检索并按得分返回 top-N 结果
   * @param query 检索关键词
   * @param limit 返回数量上限
   * @returns 检索结果
   */
  async search(
    query: string,
    limit = 5,
    qualityGate: RagSearchQualityGate = this.defaultSearchQualityGate,
    routingOverride: RagSearchRoutingOverride = {},
  ): Promise<RagSearchMatch[]> {
    // 检索分数采用“向量相似度 + 关键词命中”的混合策略，兼顾效果和可解释性。
    const routingConfig = mergeRagSearchRoutingConfig(
      this.searchRoutingConfig,
      routingOverride,
    )
    const knowledgeDomains = normalizeRagKnowledgeDomains(routingConfig.knowledgeDomains)
    const queryEmbedding = await this.aiService.embedTexts({
      texts: [query],
    })
    const [queryVector] = queryEmbedding.embeddings
    const vectorStoreMatches = await this.searchFromVectorStore(
      queryVector ?? [],
      limit,
      routingConfig,
      knowledgeDomains,
    )

    if (vectorStoreMatches) {
      if (vectorStoreMatches.length > 0 || !routingConfig.fallbackToLocal) {
        return applyRagSearchQualityGate(vectorStoreMatches, qualityGate)
      }
    }

    const topMatches = await this.searchFromLocalIndex(
      query,
      queryVector ?? [],
      limit,
      routingConfig.vectorScope === 'all' ? undefined : routingConfig.vectorScope,
      knowledgeDomains,
    )

    return applyRagSearchQualityGate(topMatches, qualityGate)
  }

  private async searchFromLocalIndex(
    query: string,
    queryVector: number[],
    limit: number,
    sourceScope?: RagSourceScope,
    knowledgeDomains?: RagKnowledgeDomain[],
  ): Promise<RagSearchMatch[]> {
    const index = await this.ensureIndex()
    const localMatches = buildLocalRagSearchContext({
      query,
      queryVector,
      chunks: index.chunks,
    })

    const databaseMatches = await this.searchChunksFromDatabase(
      query,
      queryVector,
      sourceScope,
    )
    const staticKnowledgeMatches = localMatches.filter(
      (item) =>
        (item.section === 'knowledge' || item.sourceType === 'knowledge') &&
        doesRagChunkMatchKnowledgeDomains(item, knowledgeDomains),
    )
    // 文件索引的 resume section 是基本信息表格，无语义价值，排除
    const fileResumeChunks = localMatches.filter(
      (item) =>
        item.sourceType !== 'knowledge' &&
        item.section !== 'resume' &&
        doesRagChunkMatchKnowledgeDomains(item, knowledgeDomains),
    )
    // 统一融合三源。resume_core 优先于 user_docs，保证简历内容不会被
    // 兴趣爱好等非核心资料挤出回答上下文。
    const databaseFilteredMatches = databaseMatches.matches.filter((item) =>
      doesRagChunkMatchKnowledgeDomains(item, knowledgeDomains),
    )
    const merged = [...fileResumeChunks, ...databaseFilteredMatches, ...staticKnowledgeMatches]
      .sort((a, b) => {
        const aPriority = a.sourceType === 'resume_core' || a.sourceType === 'resume' ? 0 : 1
        const bPriority = b.sourceType === 'resume_core' || b.sourceType === 'resume' ? 0 : 1
        if (aPriority !== bPriority) return aPriority - bPriority
        return b.score - a.score
      })

    return applyRagSearchRerank(merged, query, limit)
  }

  /**
   * 从 SQLite rag_chunks 表中检索 user_docs 匹配项。
   *
   * 不依赖 Milvus：直接读取 ingest 时预存的 embedding，在内存中做
   * 余弦相似度计算。适用于 ECS 等无法运行向量数据库的生产环境。
   *
   * @param queryVector 查询向量
   */
  private async searchChunksFromDatabase(
    query: string,
    queryVector: number[],
    sourceScope?: RagSourceScope,
  ): Promise<{
    hasScopedResumeCore: boolean
    matches: RagSearchMatch[]
  }> {
    if (queryVector.length === 0) {
      return {
        hasScopedResumeCore: false,
        matches: [],
      }
    }

    try {
      const rows = await this.ragRetrievalRepository.listAllChunksWithDocuments()
      const scopedRows =
        sourceScope
          ? rows.filter((row) => row.documentSourceScope === sourceScope)
          : rows
      const hasScopedResumeCore = scopedRows.some(
        (row) => row.documentSourceType === 'resume_core',
      )
      const candidateRows = hasScopedResumeCore ? scopedRows : rows

      const matches = candidateRows
        // 过滤："基本信息"表格 chunk（section=resume）对语义搜索无价值
        // — 只保留 projects / work_experience / skills / core_strengths 等实质内容
        .filter((row) => row.section !== 'resume')
        .map((row) => {
          const embedding = row.embeddingJson ?? []
          const semanticScore =
            embedding.length > 0 ? cosineSimilarity(queryVector, embedding) : 0
          const keywordScore = calculateKeywordScore(query, row.content)
          const score = Number(
            (semanticScore * 0.7 + keywordScore * 0.3).toFixed(6),
          )
          const metadata =
            row.metadataJson && typeof row.metadataJson === 'object' ? row.metadataJson : null
          const docMeta =
            row.documentMetadataJson && typeof row.documentMetadataJson === 'object'
              ? (row.documentMetadataJson as Record<string, unknown>)
              : null
          const fileName =
            metadata && typeof metadata.fileName === 'string' ? metadata.fileName : undefined
          const rawContentType =
            (docMeta?.contentType as string | undefined) ??
            (metadata?.contentType as string | undefined)
          const rawKnowledgeDomain = metadata?.knowledgeDomain ?? docMeta?.knowledgeDomain
          const rawRenderHint = metadata?.renderHint ?? docMeta?.renderHint
          const sourceCollection =
            (metadata?.sourceCollection as string | undefined) ??
            (docMeta?.sourceCollection as string | undefined)
          const resolvedMetadata = resolveRagChunkKnowledgeMetadata({
            id: row.chunkId,
            title: fileName ?? row.documentTitle ?? row.documentSourceType,
            section: row.section,
            content: row.content,
            sourceType: row.documentSourceType,
            sourcePath: fileName,
            tags: Array.isArray(metadata?.tags) ? (metadata.tags as string[]) : undefined,
            contentType: normalizeRagContentType(rawContentType),
            knowledgeDomain: isRagKnowledgeDomain(rawKnowledgeDomain) ? rawKnowledgeDomain : undefined,
            renderHint: isRagRenderHint(rawRenderHint) ? rawRenderHint : undefined,
            sourceCollection: sourceCollection as RagSourceCollection | undefined,
          })

          return {
            id: row.chunkId,
            title: fileName ?? row.documentTitle ?? row.documentSourceType,
            section: row.section,
            content: row.content,
            sourceType: row.documentSourceType,
            sourcePath: fileName,
            score,
            tags: Array.isArray(metadata?.tags) ? (metadata.tags as string[]) : undefined,
            contentType: resolvedMetadata.contentType,
            knowledgeDomain: resolvedMetadata.knowledgeDomain,
            renderHint: resolvedMetadata.renderHint,
            sourceCollection: resolvedMetadata.sourceCollection,
            richCard: resolveRichCardMetadata(metadata, docMeta),
          }
        })
        .filter(
          (match) =>
            match.score > 0 ||
            (hasScopedResumeCore && match.sourceType === 'user_docs'),
        )
        .sort((a, b) => b.score - a.score)

      return {
        hasScopedResumeCore,
        matches,
      }
    } catch {
      // user_docs 检索失败时不影响 resume_core/knowledge 结果
      return {
        hasScopedResumeCore: false,
        matches: [],
      }
    }
  }

  /**
   * 在灰度开关开启时，尝试走向量存储检索。
   *
   * 返回值约定：
   * - `null`：未启用向量检索，或发生错误且允许回退；
   * - `[]`：已启用向量检索且命中为空（是否回退由上层控制）。
   */
  private async searchFromVectorStore(
    queryVector: number[],
    limit: number,
    routingConfig: ReturnType<typeof mergeRagSearchRoutingConfig>,
    knowledgeDomains?: RagKnowledgeDomain[],
  ): Promise<RagSearchMatch[] | null> {
    if (!routingConfig.useVectorStore) {
      return null
    }

    try {
      const sourceScope =
        routingConfig.vectorScope === 'all'
          ? undefined
          : routingConfig.vectorScope
      const matches = await this.ragVectorStore.search({
        queryVector,
        limit,
        sourceScope,
        knowledgeDomains,
      })
      this.markVectorStoreHealthy()

      return matches
        .map((item) => this.mapVectorMatchToSearchMatch(item))
        .filter((item) => doesRagChunkMatchKnowledgeDomains(item, knowledgeDomains))
    } catch (error) {
      this.markVectorStoreUnavailable(error, routingConfig)

      if (routingConfig.fallbackToLocal) {
        return null
      }

      throw new Error(
        normalizeUnknownErrorMessage(
          error,
          'Vector store search failed and local fallback is disabled.',
        ),
        { cause: error },
      )
    }
  }

  private mapVectorMatchToSearchMatch(match: RagVectorSearchMatch): RagSearchMatch {
    const metadata =
      match.metadataJson && typeof match.metadataJson === 'object' ? match.metadataJson : null
    const fileName =
      metadata && typeof metadata.fileName === 'string' ? metadata.fileName : undefined
    const contentType =
      metadata && typeof metadata.contentType === 'string' ? metadata.contentType : undefined
    const knowledgeDomain = metadata?.knowledgeDomain
    const renderHint = metadata?.renderHint
    const sourceCollection =
      metadata && typeof metadata.sourceCollection === 'string'
        ? metadata.sourceCollection
        : undefined
    const resolvedMetadata = resolveRagChunkKnowledgeMetadata({
      id: match.id,
      title: fileName ?? `${match.sourceType}:${match.documentId}`,
      section: match.section,
      content: match.content,
      sourceType: match.sourceType,
      sourcePath: fileName,
      contentType: normalizeRagContentType(contentType),
      knowledgeDomain: isRagKnowledgeDomain(knowledgeDomain) ? knowledgeDomain : undefined,
      renderHint: isRagRenderHint(renderHint) ? renderHint : undefined,
      sourceCollection: sourceCollection as RagSourceCollection | undefined,
    })

    return {
      id: match.id,
      title: fileName ?? `${match.sourceType}:${match.documentId}`,
      section: match.section,
      content: match.content,
      sourceType: match.sourceType,
      sourcePath: fileName,
      score: Number(match.score.toFixed(6)),
      contentType: resolvedMetadata.contentType,
      knowledgeDomain: resolvedMetadata.knowledgeDomain,
      sourceCollection: resolvedMetadata.sourceCollection,
      renderHint: resolvedMetadata.renderHint,
      richCard: resolveRichCardMetadata(metadata),
    }
  }

  /**
   * 基于检索结果拼接上下文并生成回答
   * @param question 提问内容
   * @param limit 检索上下文数量
   * @param locale 回答语言
   * @param routingOverride 请求级检索路由覆盖项
   * @returns 问答结果
   */
  async ask(
    question: string,
    limit = 4,
    locale: 'zh' | 'en' = 'zh',
    routingOverride: RagSearchRoutingOverride = {},
    streamOptions?: { onToken?: (token: string) => void },
  ): Promise<RagAskResult> {
    // ask = search + context assembly + generateText。
    const startedAt = Date.now()

    // 辱骂输入直接拦截，其余交 LLM 分级处理
    const redirect = detectRedirect(question, locale)
    if (redirect) {
      return {
        answer: redirect,
        citations: [],
        matches: [],
        providerSummary: this.aiService.getProviderSummary(),
      }
    }

    const matches = await this.search(question, limit, this.defaultSearchQualityGate, routingOverride)
    const filteredMatches = filterMatchesForAskByLocale(matches, locale)

    // 问题策略重排 + 最低分过滤 + 取前 5
    const strategy = detectRagSearchQuestionStrategy(question)
    const reranked = rerankRagSearchMatches(filteredMatches, question, strategy, DEFAULT_RAG_SEARCH_RERANK_CONFIG)
    const aboveThreshold = reranked.filter((item) => item.rerankScore >= 0.1)
    const topMatches = aboveThreshold.length > 0
      ? aboveThreshold.slice(0, 5).map((item) => item.match)
      : filteredMatches.slice(0, 5)

    const citations = buildRagAskCitations(topMatches)
    const providerSummary = this.aiService.getProviderSummary()

    if (citations.length === 0) {
      this.logger.log({
        event: 'rag.ask.completed',
        status: 'insufficient_context',
        question,
        matchCount: 0,
        citationCount: 0,
        durationMs: Date.now() - startedAt,
        provider: providerSummary.provider,
        model: providerSummary.model,
      })

      return {
        answer: buildInsufficientContextAnswer(locale),
        citations,
        matches: topMatches,
        providerSummary,
      }
    }

    const context = topMatches
      .map(
        (item, index) =>
          `[#${index + 1}] ${item.title}\nsection=${item.section}\nsource=${item.sourceType ?? 'resume'}\n${item.content}`,
      )
      .join('\n\n')

    const systemPrompt = buildRagAskSystemPrompt(locale)
    const prompt = buildRagAskPrompt({
      question,
      context,
      locale,
    })

    const onToken = streamOptions?.onToken

    const result = onToken
      ? await this.aiService.generateTextStream({
          systemPrompt,
          prompt,
          onToken,
        })
      : await this.aiService.generateText({
          systemPrompt,
          prompt,
        })

    this.logger.log({
      event: 'rag.ask.completed',
      status: 'answered',
      question,
      matchCount: topMatches.length,
      citationCount: citations.length,
      sources: citations.map((item) => ({
        ref: item.ref,
        sourceType: item.sourceType,
        title: item.title,
        score: item.score,
      })),
      durationMs: Date.now() - startedAt,
      provider: providerSummary.provider,
      model: providerSummary.model,
    })

    return {
      answer: result.text,
      citations,
      matches: topMatches,
      providerSummary,
    }
  }

  /**
   * 确保索引可用，不存在时自动触发重建
   * @returns 可用索引
   */
  private async ensureIndex(): Promise<RagIndexFile> {
    const currentIndex = this.ragIndexRepository.readIndex()

    if (currentIndex) {
      return currentIndex
    }

    await this.rebuildIndex()

    const rebuiltIndex = this.ragIndexRepository.readIndex()

    if (!rebuiltIndex) {
      throw new Error('RAG index rebuild failed')
    }

    return rebuiltIndex
  }

  private markVectorStoreHealthy() {
    if (this.ragVectorStore.backend === 'local') {
      return
    }

    this.vectorStoreAvailable = true
    this.lastVectorStoreError = null
  }

  private markVectorStoreUnavailable(
    error: unknown,
    routingConfig: ReturnType<typeof mergeRagSearchRoutingConfig>,
  ) {
    if (this.ragVectorStore.backend === 'local') {
      return
    }

    const message = normalizeUnknownErrorMessage(
      error,
      'Vector store is unavailable.',
    )

    this.vectorStoreAvailable = false
    this.lastVectorStoreError = message
    this.logger.warn({
      event: 'rag.vector_store.degraded',
      backend: this.ragVectorStore.backend,
      vectorScope: routingConfig.vectorScope,
      fallbackToLocal: routingConfig.fallbackToLocal,
      message,
    })
  }
}

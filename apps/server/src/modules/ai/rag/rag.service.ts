import { Inject, Injectable } from '@nestjs/common'
import { createHash } from 'crypto'
import { existsSync, readFileSync, readdirSync } from 'fs'
import { join } from 'path'

import { AiService } from '../ai.service'
import { RagChunkService } from './rag-chunk.service'
import { RagIndexRepository } from './rag-index.repository'
import { RagKnowledgeService } from './rag-knowledge.service'
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
import { RagIndexFile, RagSearchMatch } from './rag.types'
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

function buildSearchTokens(text: string): string[] {
  const normalized = text.trim().toLowerCase()
  const latinTokens = normalized.match(/[a-z0-9.+#-]+/g) ?? []
  const hanSequences = normalized.match(/[\p{Script=Han}]+/gu) ?? []
  const hanBigrams = hanSequences.flatMap((item) => {
    if (item.length === 1) {
      return [item]
    }

    const tokens: string[] = []

    for (let index = 0; index < item.length - 1; index += 1) {
      tokens.push(item.slice(index, index + 2))
    }

    return tokens
  })

  return [...new Set([...latinTokens, ...hanBigrams])]
}

function calculateKeywordScore(query: string, content: string): number {
  const queryTokens = buildSearchTokens(query)

  if (queryTokens.length === 0) {
    return 0
  }

  const normalizedContent = content.toLowerCase()
  const hitCount = queryTokens.filter((token) => normalizedContent.includes(token)).length

  return hitCount / queryTokens.length
}

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length === 0 || vectorB.length === 0) {
    return 0
  }

  const length = Math.min(vectorA.length, vectorB.length)
  let dot = 0
  let magnitudeA = 0
  let magnitudeB = 0

  for (let index = 0; index < length; index += 1) {
    dot += vectorA[index] * vectorB[index]
    magnitudeA += vectorA[index] * vectorA[index]
    magnitudeB += vectorB[index] * vectorB[index]
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB))
}

@Injectable()
export class RagService {
  private readonly defaultSearchQualityGate: RagSearchQualityGate =
    resolveRagSearchQualityGate(process.env)
  private readonly searchRoutingConfig = resolveRagSearchRoutingConfig(process.env)

  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(RagChunkService)
    private readonly ragChunkService: RagChunkService,
    @Inject(RagKnowledgeService)
    private readonly ragKnowledgeService: RagKnowledgeService,
    @Inject(RagIndexRepository)
    private readonly ragIndexRepository: RagIndexRepository,
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
    const queryEmbedding = await this.aiService.embedTexts({
      texts: [query],
    })
    const [queryVector] = queryEmbedding.embeddings
    const vectorStoreMatches = await this.searchFromVectorStore(
      queryVector ?? [],
      limit,
      routingConfig,
    )

    if (vectorStoreMatches) {
      if (vectorStoreMatches.length > 0 || !routingConfig.fallbackToLocal) {
        return applyRagSearchQualityGate(vectorStoreMatches, qualityGate)
      }
    }

    const topMatches = await this.searchFromLocalIndex(query, queryVector ?? [], limit)

    return applyRagSearchQualityGate(topMatches, qualityGate)
  }

  private async searchFromLocalIndex(
    query: string,
    queryVector: number[],
    limit: number,
  ): Promise<RagSearchMatch[]> {
    const index = await this.ensureIndex()

    const topMatches = index.chunks
      .map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        section: chunk.section,
        content: chunk.content,
        sourceType: chunk.sourceType,
        sourcePath: chunk.sourcePath,
        score: Number(
          (
            cosineSimilarity(queryVector, chunk.embedding) * 0.7 +
            calculateKeywordScore(query, chunk.content) * 0.3
          ).toFixed(6),
        ),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)

    return topMatches
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
      })

      return matches.map((item) => this.mapVectorMatchToSearchMatch(item))
    } catch (error) {
      if (routingConfig.fallbackToLocal) {
        return null
      }

      throw error
    }
  }

  private mapVectorMatchToSearchMatch(match: RagVectorSearchMatch): RagSearchMatch {
    const metadata =
      match.metadataJson && typeof match.metadataJson === 'object' ? match.metadataJson : null
    const fileName =
      metadata && typeof metadata.fileName === 'string' ? metadata.fileName : undefined

    return {
      id: match.id,
      title: fileName ?? `${match.sourceType}:${match.documentId}`,
      section: match.section,
      content: match.content,
      sourceType: match.sourceType,
      sourcePath: fileName,
      score: Number(match.score.toFixed(6)),
    }
  }

  /**
   * 基于检索结果拼接上下文并生成回答
   * @param question 提问内容
   * @param limit 检索上下文数量
   * @param locale 回答语言
   * @returns 问答结果
   */
  async ask(question: string, limit = 4, locale: 'zh' | 'en' = 'zh') {
    // ask = search + context assembly + generateText。
    const matches = await this.search(question, limit)
    const context = matches
      .map(
        (item, index) =>
          `[#${index + 1}] ${item.title}\nsection=${item.section}\nsource=${item.sourceType ?? 'resume'}\n${item.content}`,
      )
      .join('\n\n')

    const answer = await this.aiService.generateText({
      systemPrompt:
        locale === 'en'
          ? 'You are a resume knowledge assistant. Answer only from the retrieved resume context and mention uncertainty when context is insufficient.'
          : '你是一个简历知识库助手。只能根据检索到的简历上下文回答；如果上下文不足，请明确说明。',
      prompt:
        locale === 'en'
          ? [
              `Question: ${question}`,
              'Retrieved context:',
              context,
              'Return a concise answer and keep it grounded in the context.',
            ].join('\n\n')
          : [
              `问题：${question}`,
              '检索到的上下文：',
              context,
              '请基于这些上下文给出简洁回答，并保持结论可追溯。',
            ].join('\n\n'),
    })

    return {
      answer: answer.text,
      matches,
      providerSummary: this.aiService.getProviderSummary(),
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
}

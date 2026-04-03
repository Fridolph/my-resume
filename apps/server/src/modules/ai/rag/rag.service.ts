import { Inject, Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';

import { AiService } from '../ai.service';
import { RagChunkService } from './rag-chunk.service';
import { RagIndexRepository } from './rag-index.repository';
import { RagKnowledgeService } from './rag-knowledge.service';
import { RagIndexFile, RagSearchMatch } from './rag.types';

function buildSearchTokens(text: string): string[] {
  const normalized = text.trim().toLowerCase();
  const latinTokens = normalized.match(/[a-z0-9.+#-]+/g) ?? [];
  const hanSequences = normalized.match(/[\p{Script=Han}]+/gu) ?? [];
  const hanBigrams = hanSequences.flatMap((item) => {
    if (item.length === 1) {
      return [item];
    }

    const tokens: string[] = [];

    for (let index = 0; index < item.length - 1; index += 1) {
      tokens.push(item.slice(index, index + 2));
    }

    return tokens;
  });

  return [...new Set([...latinTokens, ...hanBigrams])];
}

function calculateKeywordScore(query: string, content: string): number {
  const queryTokens = buildSearchTokens(query);

  if (queryTokens.length === 0) {
    return 0;
  }

  const normalizedContent = content.toLowerCase();
  const hitCount = queryTokens.filter((token) =>
    normalizedContent.includes(token),
  ).length;

  return hitCount / queryTokens.length;
}

function cosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (vectorA.length === 0 || vectorB.length === 0) {
    return 0;
  }

  const length = Math.min(vectorA.length, vectorB.length);
  let dot = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let index = 0; index < length; index += 1) {
    dot += vectorA[index] * vectorB[index];
    magnitudeA += vectorA[index] * vectorA[index];
    magnitudeB += vectorB[index] * vectorB[index];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
}

@Injectable()
export class RagService {
  constructor(
    @Inject(AiService)
    private readonly aiService: AiService,
    @Inject(RagChunkService)
    private readonly ragChunkService: RagChunkService,
    @Inject(RagKnowledgeService)
    private readonly ragKnowledgeService: RagKnowledgeService,
    @Inject(RagIndexRepository)
    private readonly ragIndexRepository: RagIndexRepository,
  ) {}

  getStatus() {
    const { sourcePath, blogDirectoryPath, indexPath } =
      this.ragIndexRepository.getPaths();
    const index = this.ragIndexRepository.readIndex();

    return {
      sourcePath,
      blogDirectoryPath,
      indexPath,
      indexed: Boolean(index),
      chunkCount: index?.chunkCount ?? 0,
      resumeChunkCount:
        index?.chunks.filter((item) => item.sourceType !== 'knowledge').length ??
        0,
      knowledgeChunkCount:
        index?.chunks.filter((item) => item.sourceType === 'knowledge').length ??
        0,
      generatedAt: index?.generatedAt ?? null,
    };
  }

  async rebuildIndex() {
    const { sourcePath, blogDirectoryPath } = this.ragIndexRepository.getPaths();
    const source = readFileSync(sourcePath, 'utf8');
    const document = this.ragChunkService.parseSource(source);
    const chunks = [
      ...this.ragChunkService.buildChunks(document),
      ...this.ragKnowledgeService.buildArticleChunksFromDirectory(
        blogDirectoryPath,
      ),
    ];
    const embeddingResult = await this.aiService.embedTexts({
      texts: chunks.map((item) => item.content),
    });

    const index: RagIndexFile = {
      sourcePath,
      generatedAt: new Date().toISOString(),
      chunkCount: chunks.length,
      chunks: chunks.map((chunk, indexPosition) => ({
        ...chunk,
        embedding: embeddingResult.embeddings[indexPosition] ?? [],
      })),
    };

    this.ragIndexRepository.writeIndex(index);

    return {
      ...this.getStatus(),
      providerSummary: this.aiService.getProviderSummary(),
    };
  }

  async search(query: string, limit = 5): Promise<RagSearchMatch[]> {
    const index = await this.ensureIndex();
    const queryEmbedding = await this.aiService.embedTexts({
      texts: [query],
    });
    const [queryVector] = queryEmbedding.embeddings;

    return index.chunks
      .map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        section: chunk.section,
        content: chunk.content,
        sourceType: chunk.sourceType,
        sourcePath: chunk.sourcePath,
        score: Number(
          (
            cosineSimilarity(queryVector ?? [], chunk.embedding) * 0.7 +
            calculateKeywordScore(query, chunk.content) * 0.3
          ).toFixed(6),
        ),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  async ask(question: string, limit = 4, locale: 'zh' | 'en' = 'zh') {
    const matches = await this.search(question, limit);
    const context = matches
      .map(
        (item, index) =>
          `[#${index + 1}] ${item.title}\nsection=${item.section}\nsource=${item.sourceType ?? 'resume'}\n${item.content}`,
      )
      .join('\n\n');

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
    });

    return {
      answer: answer.text,
      matches,
      providerSummary: this.aiService.getProviderSummary(),
    };
  }

  private async ensureIndex(): Promise<RagIndexFile> {
    const currentIndex = this.ragIndexRepository.readIndex();

    if (currentIndex) {
      return currentIndex;
    }

    await this.rebuildIndex();

    const rebuiltIndex = this.ragIndexRepository.readIndex();

    if (!rebuiltIndex) {
      throw new Error('RAG index rebuild failed');
    }

    return rebuiltIndex;
  }
}

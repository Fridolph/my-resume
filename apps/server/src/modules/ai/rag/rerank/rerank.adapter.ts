/**
 * Rerank 模型适配器 — Cross-Encoder 精排。
 *
 * 当前对接 DashScope qwen3-rerank API。
 * 输入 query + documents[] → 输出 relevance_score 降序排列的 index 列表。
 */

import { Logger } from '@nestjs/common'

const logger = new Logger('RerankAdapter')

/** Rerank API 单次调用参数 */
export interface RerankInput {
  /** 用户原始问题 */
  query: string
  /** 待评估的文档内容列表 */
  documents: string[]
  /** 返回 top N 条（默认 3） */
  topN?: number
}

/** Rerank API 单次调用结果 */
export interface RerankOutput {
  /** 按 relevance_score 降序排列的文档索引 */
  indices: number[]
  /** 对应索引的相关度分数 (0-1) */
  scores: number[]
}

/** Rerank 适配器接口（方便后续切换模型） */
export interface RerankAdapter {
  rerank(input: RerankInput): Promise<RerankOutput>
}

/**
 * DashScope qwen3-rerank 适配器。
 *
 * API 文档：https://help.aliyun.com/zh/model-studio/rerank
 *
 * 请求格式：
 * POST https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank
 * { model: "qwen3-rerank", input: { query, documents }, parameters: { top_n } }
 *
 * 响应格式：
 * { output: { results: [{ index, relevance_score }] } }
 */
export function createDashScopeRerankAdapter(config: {
  apiKey: string
  baseUrl?: string
  model?: string
}): RerankAdapter {
  const apiKey = config.apiKey
  const baseUrl =
    config.baseUrl?.trim().replace(/\/$/, '') ??
    'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank'
  const model = config.model?.trim() || 'qwen3-rerank'

  return {
    async rerank(input: RerankInput): Promise<RerankOutput> {
      const documents = input.documents
      const topN = input.topN ?? 3

      if (documents.length === 0) {
        return { indices: [], scores: [] }
      }

      logger.log({
        event: 'rerank.model.request',
        model,
        query: input.query.slice(0, 80),
        documentCount: documents.length,
        topN,
      })

      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: {
            query: input.query,
            documents,
          },
          parameters: { top_n: topN },
        }),
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Rerank API error ${response.status}: ${body.slice(0, 200)}`)
      }

      const data = (await response.json()) as {
        output?: { results?: Array<{ index: number; relevance_score: number }> }
      }

      const results = data.output?.results ?? []

      if (results.length === 0) {
        logger.warn({
          event: 'rerank.model.empty_result',
          model,
          query: input.query.slice(0, 80),
        })
        return { indices: [], scores: [] }
      }

      const sorted = [...results].sort((a, b) => b.relevance_score - a.relevance_score)

      logger.log({
        event: 'rerank.model.completed',
        model,
        resultCount: results.length,
        topScore: sorted[0]?.relevance_score,
        bottomScore: sorted[sorted.length - 1]?.relevance_score,
      })

      return {
        indices: sorted.map((r) => r.index),
        scores: sorted.map((r) => r.relevance_score),
      }
    },
  }
}

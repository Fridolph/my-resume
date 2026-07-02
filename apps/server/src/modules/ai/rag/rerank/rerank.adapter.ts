/**
 * Rerank 模型适配器 — Cross-Encoder 精排。
 *
 * 当前对接 DashScope qwen3-rerank API。
 * 输入 query + documents[] → 输出 relevance_score 降序排列的 index 列表。
 *
 * 职责：
 * - 封装 Rerank API 调用（HTTP POST + JSON）
 * - 将 API 返回的 { index, relevance_score } 映射为 RerankOutput
 * - 记录请求/响应日志（query、documentCount、topScore）
 * - 错误处理：网络异常、空结果、非 2xx 响应
 *
 * ## Cross-Encoder vs Bi-Encoder
 *
 * Embedding 模型是双塔结构——问题和文档分别编码再比较，两者互相看不到对方。
 * Rerank 模型是交叉编码——把问题和文档拼在一起输入，模型能理解具体关联，打出
 * 更精准的分数。代价是速度慢，所以只用于精排阶段（≤40 条候选）。
 */

import { Logger } from '@nestjs/common'

const logger = new Logger('RerankAdapter')

/**
 * Rerank API 单次调用参数。
 *
 * 对应 DashScope Rerank API 的 input 字段。
 *
 * @see https://help.aliyun.com/zh/model-studio/rerank
 */
export interface RerankInput {
  /** 用户原始问题（不截断，完整传入） */
  query: string
  /** 待评估的文档内容列表（按原始检索顺序） */
  documents: string[]
  /** 返回 top N 条结果（默认 3，取值范围 1-100） */
  topN?: number
}

/**
 * Rerank API 单次调用结果。
 *
 * indices 和 scores 已按 relevance_score 降序排列，
 * indices[i] 对应原始 documents 数组中的位置。
 */
export interface RerankOutput {
  /** 按 relevance_score 降序排列的文档索引（指向原始 documents 数组） */
  indices: number[]
  /** 对应索引的相关度分数（0-1，1 表示完全相关） */
  scores: number[]
}

/**
 * Rerank 适配器接口。
 *
 * 抽象化 Rerank 模型调用，方便后续切换模型（如 DashScope → 本地模型）。
 * 实现类只需关注 HTTP 调用和响应解析，调用方通过接口消费。
 */
export interface RerankAdapter {
  /**
   * 调用 Rerank API 对候选文档重排序。
   *
   * @param input - 查询参数（query + documents + topN）
   * @returns RerankOutput - 按 relevance_score 降序排列的索引和分数
   * @throws {Error} API 返回非 2xx 状态码时抛出
   */
  rerank(input: RerankInput): Promise<RerankOutput>
}

/**
 * 创建 DashScope qwen3-rerank 适配器。
 *
 * 封装 DashScope Rerank API 的完整调用流程：
 * 1. 构造 HTTP POST 请求（Authorization + JSON body）
 * 2. 调用 API 并解析响应
 * 3. 按 relevance_score 降序排列结果
 * 4. 记录结构化日志（request → response）
 *
 * API 文档：https://help.aliyun.com/zh/model-studio/rerank
 *
 * **请求格式**
 * ```
 * POST /api/v1/services/rerank/text-rerank/text-rerank
 * Authorization: Bearer {apiKey}
 * Content-Type: application/json
 * {
 *   "model": "qwen3-rerank",
 *   "input": { "query": "...", "documents": ["...", "..."] },
 *   "parameters": { "top_n": 3 }
 * }
 * ```
 *
 * **响应格式**
 * ```
 * { "output": { "results": [{ "index": 0, "relevance_score": 0.95 }] } }
 * ```
 *
 * @param config - API 配置
 * @param config.apiKey - DashScope API Key（必填）
 * @param config.baseUrl - Rerank API 地址（默认 DashScope 官方地址）
 * @param config.model - 模型名称（默认 qwen3-rerank）
 * @returns RerankAdapter 实例
 *
 * @example
 * ```ts
 * const adapter = createDashScopeRerankAdapter({
 *   apiKey: 'sk-xxx',
 *   model: 'qwen3-rerank',
 * })
 * const result = await adapter.rerank({
 *   query: '你有什么兴趣爱好',
 *   documents: ['羽毛球...', '音乐...', '编程...'],
 *   topN: 3,
 * })
 * // result.indices → [1, 0, 2]（按相关性降序）
 * // result.scores → [0.92, 0.85, 0.43]
 * ```
 */
export function createDashScopeRerankAdapter(config: {
  /** API Key（必填） */
  apiKey: string
  /** Rerank API 地址，默认 DashScope 官方 */
  baseUrl?: string
  /** 模型名称，默认 qwen3-rerank */
  model?: string
}): RerankAdapter {
  const apiKey = config.apiKey
  // 去掉尾部斜杠，统一 URL 格式
  const baseUrl =
    config.baseUrl?.trim().replace(/\/$/, '') ??
    'https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank'
  const model = config.model?.trim() || 'qwen3-rerank'

  return {
    /**
     * 调用 Rerank API 对候选文档重排序。
     *
     * ## 内部流程
     * 1. 空文档列表 → 直接返回空结果（避免无效 HTTP 调用）
     * 2. 构造 HTTP POST 请求 → 调用 DashScope Rerank API
     * 3. 解析 response.json() → 提取 output.results[]
     * 4. 按 relevance_score 降序排列 → 映射为 RerankOutput
     * 5. 记录日志：request（query + documentCount）→ response（topScore + bottomScore）
     *
     * @param input - 查询参数
     * @param input.query - 用户原始问题
     * @param input.documents - 待排序文档列表
     * @param input.topN - 返回条数（默认 3）
     * @returns 按相关度降序排列的索引和分数
     * @throws {Error} API 返回非 2xx 状态码
     */
    async rerank(input: RerankInput): Promise<RerankOutput> {
      const documents = input.documents
      const topN = input.topN ?? 3

      // 空列表快捷返回，避免无效 HTTP 调用
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

      // 调用 DashScope Rerank API
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

      // 解析 API 响应
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

      // API 返回的 results 不保证排序，手动降序排列
      const sorted = [...results].sort((a, b) => b.relevance_score - a.relevance_score)

      logger.log({
        event: 'rerank.model.completed',
        model,
        resultCount: results.length,
        topScore: sorted[0]?.relevance_score,
        bottomScore: sorted[sorted.length - 1]?.relevance_score,
      })

      // 映射：API 的 index → 原始 documents 的索引；API 的 relevance_score → scores
      return {
        indices: sorted.map((r) => r.index),
        scores: sorted.map((r) => r.relevance_score),
      }
    },
  }
}

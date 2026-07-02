/**
 * GraphStore 接口 — Neo4j / graphology 双模图存储。
 *
 * 设计模式与 RagVectorStore 对齐：
 * - 本地 dev → Neo4jGraphStore (Docker Neo4j)
 * - 生产 ECS → MemoryGraphStore (graphology 内存图)
 *
 * 统一接口，调用方无需关心底层实现。
 */

import type { StandardResume, LocalizedText } from '../../resume/domain/standard-resume'

/** 图查询结果 */
export interface GraphSearchResult {
  /** 结果节点或关系的自然语言描述 */
  text: string
  /** 相关度分数（由 GraphStore 自行估算） */
  score: number
  /** 来源类型 */
  sourceType: 'graph'
}

/**
 * 图存储接口。
 *
 * 职责：
 * - sync：从 StandardResume 动态建图
 * - search：执行图遍历查询
 * - clear：清空图中所有数据
 */
export interface GraphStore {
  /** 同步简历数据到图 */
  sync(resume: StandardResume): Promise<void>

  /** 执行图查询（由 LLM 生成的 Cypher 语句） */
  search(cypher: string): Promise<GraphSearchResult[]>

  /** 清空图中所有节点和关系 */
  clear(): Promise<void>
}

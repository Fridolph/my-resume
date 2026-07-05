/**
 * GraphStore 工厂 — 按环境变量切换 neo4j / memory。
 *
 * 设计模式与 RagVectorStore 对齐：
 * 生产环境 GRAPH_STORE_BACKEND=memory → MemoryGraphStore
 * 本地开发 GRAPH_STORE_BACKEND=neo4j → Neo4jGraphStore
 */

import { Logger } from '@nestjs/common'
import type { GraphStore } from './graph-store.interface'
import { MemoryGraphStore } from './memory-graph-store'
import { Neo4jGraphStore } from './neo4j-graph-store'

const logger = new Logger('GraphStoreFactory')

export function createGraphStore(): GraphStore {
  const backend = process.env.GRAPH_STORE_BACKEND?.trim().toLowerCase() ?? 'memory'

  if (backend === 'neo4j') {
    const uri = process.env.NEO4J_URI ?? 'bolt://localhost:7687'
    const user = process.env.NEO4J_USER ?? 'neo4j'
    const password = process.env.NEO4J_PASSWORD ?? 'password'
    logger.log({ event: 'graph.store.init', backend: 'neo4j', uri })
    return new Neo4jGraphStore(uri, user, password)
  }

  logger.log({ event: 'graph.store.init', backend: 'memory' })
  return new MemoryGraphStore()
}

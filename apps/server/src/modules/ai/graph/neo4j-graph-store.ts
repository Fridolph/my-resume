/**
 * Neo4jGraphStore — 基于 neo4j-driver 的图存储。
 *
 * 本地开发环境使用 Docker Neo4j。生产环境使用 MemoryGraphStore 替代。
 */

import { Driver, auth, driver as neo4jDriver } from 'neo4j-driver'
import type { GraphStore, GraphSearchResult } from './graph-store.interface'
import type { StandardResume } from '../../resume/domain/standard-resume'

export class Neo4jGraphStore implements GraphStore {
  private driver: Driver | null = null

  constructor(
    private readonly uri: string,
    private readonly user: string,
    private readonly password: string,
  ) {}

  private getDriver(): Driver {
    if (!this.driver) {
      this.driver = neo4jDriver(this.uri, auth.basic(this.user, this.password))
    }
    return this.driver
  }

  async sync(_resume: StandardResume): Promise<void> {
    // Neo4j 同步委托给 GraphSyncService 生成 Cypher
    // 此方法作为占位，实际同步逻辑在 M42-I2 中实现
  }

  async search(cypher: string): Promise<GraphSearchResult[]> {
    const driver = this.getDriver()
    const session = driver.session()
    try {
      const result = await session.run(cypher)
      return result.records.map((record: { entries: () => IterableIterator<[string, unknown]> }) => {
        const entries = [...record.entries()]
        const details = entries.map(([key, value]) => `${key}: ${String(value).slice(0, 100)}`).join(', ')
        return { text: details || 'empty', score: 0.5, sourceType: 'graph' as const }
      })
    } finally {
      await session.close()
    }
  }

  async clear(): Promise<void> {
    const driver = this.getDriver()
    const session = driver.session()
    try {
      await session.run('MATCH (n) DETACH DELETE n')
    } finally {
      await session.close()
    }
  }
}

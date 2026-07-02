/**
 * GraphSearchService — LLM 转 Cypher + 执行图查询。
 *
 * 将用户自然语言问题转为 Cypher 查询语句，通过 GraphStore 执行。
 */

import { Inject, Injectable, Logger } from '@nestjs/common'
import { AiService } from '../application/services/ai.service'
import type { GraphStore, GraphSearchResult } from './graph-store.interface'

const logger = new Logger('GraphSearchService')

/** 图查询 System Prompt */
const GRAPH_SEARCH_SYSTEM_PROMPT = `你是 Cypher 查询生成器。根据用户问题生成 Neo4j Cypher 查询语句。

## 数据库 Schema

节点类型：
- (:Person {name, email}) — 简历主人
- (:Company {name}) — 公司
- (:Industry {name}) — 行业
- (:Project {name, summary}) — 项目
- (:Technology {name}) — 技术
- (:Skill {name, proficiency}) — 技能分类
- (:School {name}) — 学校
- (:Interest {name}) — 兴趣爱好
- (:Highlight {title, description}) — 亮点

关系：
- (Person)-[:任职于 {role,startDate,endDate}]->(Company)
- (Company)-[:属于]->(Industry)
- (Person)-[:参与 {role}]->(Project)
- (Project)-[:使用]->(Technology)
- (Company)-[:使用]->(Technology)
- (Person)-[:擅长]->(Skill)
- (Skill)-[:包含]->(Technology)
- (Person)-[:毕业于]->(School)
- (Person)-[:拥有]->(Interest)
- (Person)-[:具备]->(Highlight)

## 规则
1. 只生成一条 Cypher SELECT 语句（不需要 CREATE/MERGE/DELETE）
2. Person 节点用 {name: "付寅生"} 匹配
3. 返回结果用 RETURN 列出需要的属性
4. 不要用 ORDER BY，除非用户明确要求排序
5. 只返回 Cypher 语句本身，不要加任何解释`

@Injectable()
export class GraphSearchService {
  private readonly logger = new Logger(GraphSearchService.name)

  constructor(
    @Inject('GRAPH_STORE')
    private readonly store: GraphStore,
    @Inject(AiService)
    private readonly aiService: AiService,
  ) {}

  async search(question: string): Promise<GraphSearchResult[]> {
    const prompt = `用户问题：${question}\n\n请生成一条 Cypher 查询语句：`

    try {
      const result = await this.aiService.generateText({
        systemPrompt: GRAPH_SEARCH_SYSTEM_PROMPT,
        prompt,
      })

      const cypher = extractCypher(result.text)
      if (!cypher) {
        this.logger.warn({ event: 'graph.search.no_cypher', question: question.slice(0, 80) })
        return []
      }

      this.logger.log({ event: 'graph.search.generated', question: question.slice(0, 80), cypher: cypher.slice(0, 120) })

      return await this.store.search(cypher)
    } catch (error) {
      this.logger.warn({ event: 'graph.search.error', message: (error as Error).message })
      return []
    }
  }
}

/** 从 LLM 输出中提取 Cypher 语句（支持 markdown 代码块和纯文本） */
function extractCypher(text: string): string | null {
  // 尝试提取 ```cypher ... ``` 代码块
  const codeBlock = text.match(/```(?:cypher)?\s*([\s\S]*?)```/i)
  if (codeBlock) return codeBlock[1].trim()

  // 提取包含 MATCH/RETURN 的行
  const lines = text.split('\n')
  const cypherLines = lines.filter((l) =>
    /^\s*(MATCH|RETURN|WHERE|WITH|OPTIONAL)\s/i.test(l.trim()),
  )
  if (cypherLines.length > 0) return cypherLines.join('\n').trim()

  return null
}

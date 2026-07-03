# GraphRAG 复盘：从架构搭建到收口集成 — M42/M43 全过程

> my-resume 项目 M42+M43 复盘实录  
> 2026 年 7 月

---

## 一、M42 做了什么

M42 搭建了 GraphRAG 基础设施——知识图谱检索管线。

### 1.1 双模 GraphStore

```ts
// 本地开发：Docker Neo4j → 真实 Cypher 查询
// 生产 ECS：graphology 内存图 → 零额外部署

interface GraphStore {
  sync(resume: StandardResume): Promise<void>       // 建图
  search(cypher: string): Promise<GraphSearchResult[]>  // Neo4j Cypher
  traverse(startLabel: string, depth: number): Promise<GraphSearchResult[]>  // 内存遍历
  clear(): Promise<void>
}
```

### 1.2 动态 Cypher 生成

从 `StandardResume` 动态生成——不硬编码，简历改了图自动刷新：

```ts
// GraphSyncService: 遍历 experiences → Company + Technology → MERGE 语句
for (const exp of resume.experiences) {
  statements.push(`MERGE (c:Company {name: "${company}"})`)
  statements.push(`MERGE (p)-[:任职于 {role: "${role}"}]->(c)`)
}
```

### 1.3 LLM → Cypher 查询

```ts
// GraphSearchService: LLM 将自然语言转为 Cypher
const cypher = await llm.generate("他在哪些公司工作过？")
// → MATCH (p:Person)-[:任职于]->(c:Company) RETURN c.name
```

---

## 二、复盘发现的 6 个问题

### 问题 1：sync 触发时机缺失
M42 写了 sync 逻辑，但没有接到发布流程上。发布简历后图不会自动更新。

**修复**：`publish()` 后异步调用 `syncToGraph()`。

### 问题 2：MemoryStore 忽略 Cypher
LLM 生成 Cypher 后传给 memory store，memory store 不会执行。

**修复**：拆出 `traverse(startLabel, depth)` 接口，memory store 用图遍历替代 Cypher 执行。

### 问题 3：route_intent 缺少检索偏好
不知道什么时候该走 graph，什么时候该走 RAG。

**修复**：在已有 LLM 调用中多输出 `retrieval_hint` 字段（graph_first / rag_first / mixed）。

### 问题 4：retrieve 节点未集成 graph
graph 检索结果没有进入 RAG 管线。

**修复**（后续）：在 `retrieve.node.ts` 中 try/catch 调用 graphSearchService，失败时沉默降级。

### 问题 5：evaluate 不认识 graph 结果
graph 输出没有走 rerank 精排。

**修复**（后续）：graph 结果统一标注 `sourceType: 'graph'`，进入现有 Rerank 管线。

### 问题 6：容错缺失
graph 检索失败会传播到整个对话。

**修复**：try/catch + 降级策略，失败就当 graph 没装。

---

## 三、最终架构

```
用户问题 → route_intent (LLM + retrieval_hint)
  ├─ chitchat/guide → direct_answer
  ├─ out_of_scope → reject
  └─ normal → decompose
       │
       ├─ RAG 检索 (Milvus/SQLite/JSON Index)
       ├─ Graph 检索 (Neo4j/graphology)  ← 新增
       │
       └─ 去重 → Rerank (qwen3-rerank) → LLM 回答
```

---

## 四、代码文件索引

| 文件 | 做什么 |
|------|--------|
| `graph/graph-store.interface.ts` | GraphStore 接口 (sync/search/traverse/clear) |
| `graph/memory-graph-store.ts` | 生产 graphology 内存图 |
| `graph/neo4j-graph-store.ts` | 本地 Docker Neo4j |
| `graph/graph-store.factory.ts` | 按 env 切换 |
| `graph/graph-sync.service.ts` | 动态 Cypher 生成 |
| `graph/graph-search.service.ts` | LLM → Cypher |
| `nodes/route-intent.schema.ts` | 新增 retrieval_hint |
| `nodes/route-intent.node.ts` | prompt 增加检索偏好 |

---

> *昇哥 · 2026 年 7 月*

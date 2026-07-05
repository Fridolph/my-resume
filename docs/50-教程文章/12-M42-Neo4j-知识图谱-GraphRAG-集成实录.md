# 从零搭建 GraphRAG：用 Neo4j + graphology 为简历系统加上知识图谱检索

> my-resume 开源简历项目 M42 升级实录  
> 2026 年 7 月

---

## 写在前面

之前我们实现了混合检索 RAG——关键词 + 向量 + Rerank 模型。但这类检索有一个盲区：**关系型问题**。

比如：

```
"他在哪些公司工作过，分别用了什么技术？"
"他的技能和项目之间有什么关联？"
"Vue3 最早在哪家公司开始用的？"
```

这些问题需要"多跳推理"——从一个节点出发，沿着关系边找到关联节点，再继续跳转。向量检索做不到这一点。

这篇记录如何在 my-resume 项目中接入 Neo4j 知识图谱，实现 GraphRAG。

---

## 一、当前怎么实现的

### 1.1 混合检索架构

```
用户问题 → LangGraph 路由 → 并行检索：
  ├─ Milvus/JSON Snapshot (向量语义)
  ├─ SQLite + JSON Index (关键词+混合)
  └─ ← 缺少关系型检索
     → Rerank 模型 → LLM 回答
```

### 1.2 能回答什么

```ts
// ✅ 向量检索擅长：语义相似
Q: "他擅长什么前端技术"
A: "Vue, React, TypeScript..." (从 skills chunk 召回)

// ❌ 向量检索做不到：多跳关系
Q: "他在网思科平期间用了哪些技术"
A: "..." (需要联接 Company→Technology)
```

---

## 二、升级方案

### 2.1 架构设计

和 Milvus 采用相同的模式：**本地 Docker 真实数据库 + 生产内存图**：

```
本地开发: Docker Neo4j → neo4j-driver
生产 ECS: graphology 内存图 → 无额外部署
```

### 2.2 统一接口

```ts
// GraphStore 接口 — 和 RagVectorStore 一样的模式
interface GraphStore {
  sync(resume: StandardResume): Promise<void>
  search(cypher: string): Promise<GraphSearchResult[]>
  clear(): Promise<void>
}
```

### 2.3 两个实现

| 实现 | 依赖 | 何时使用 |
|------|------|---------|
| `Neo4jGraphStore` | `neo4j-driver` | 本地 dev |
| `MemoryGraphStore` | `graphology` (50KB) | 生产 ECS |

---

## 三、怎么做的

### 3.1 从简历动态建图

不写死 Cypher，而是从 `StandardResume` 动态生成。核心在 `GraphSyncService`：

```ts
// graph-sync.service.ts
async syncToGraph(resume: StandardResume, store: GraphStore) {
  await store.clear()
  
  const statements: string[] = []
  
  // Person 节点
  statements.push(`MERGE (p:Person {name: "${resume.profile.fullName}"})`)
  
  // 遍历 experiences → Company + Industry + Technology
  for (const exp of resume.experiences) {
    const company = exp.companyName
    statements.push(`MERGE (c:Company {name: "${company}"})`)
    statements.push(`MERGE (p)-[:任职于 {role: "${exp.role}"}]->(c)`)
    
    for (const tech of exp.technologies) {
      statements.push(`MERGE (t:Technology {name: "${tech}"})`)
      statements.push(`MERGE (c)-[:使用]->(t)`)
    }
  }
  
  // 项目、技能、教育、兴趣...同理
  
  await store.search(statements.join('\n'))
}
```

关键设计：**全部用 `MERGE`**，保证幂等。重复执行不会产生重复数据。

### 3.2 GraphSearchService — LLM 转 Cypher

```ts
// graph-search.service.ts
const GRAPH_SEARCH_SYSTEM_PROMPT = `
你是 Cypher 查询生成器。已知节点类型：Person, Company, Project, Technology, Skill...
关系：(Person)-[:任职于]->(Company), (Project)-[:使用]->(Technology)...
`

async search(question: string): Promise<GraphSearchResult[]> {
  const result = await this.aiService.generateText({
    systemPrompt: GRAPH_SEARCH_SYSTEM_PROMPT,
    prompt: `用户问题：${question}`,
  })
  
  const cypher = extractCypher(result.text) // 提取 ```cypher``` 代码块
  return await this.store.search(cypher)
}
```

### 3.3 双模切换

```ts
// graph-store.factory.ts
export function createGraphStore(): GraphStore {
  const backend = process.env.GRAPH_STORE_BACKEND ?? 'memory'
  
  if (backend === 'neo4j') {
    return new Neo4jGraphStore(uri, user, password)  // 本地 Docker
  }
  return new MemoryGraphStore()  // 生产内存图
}
```

---

## 四、效果对比

### 4.1 查询能力

| 问题类型 | 纯向量 RAG | + GraphRAG |
|---------|-----------|-----------|
| "他擅长什么技术" | ✅ 语义匹配 | ✅ 同样支持 |
| "他在哪些公司用过 React" | ⚠️ 可能遗漏 | ✅ 精确返回 |
| "Vue3 最早在哪家公司用" | ❌ 做不到 | ✅ 关系追溯 |
| "他的技术栈演进路径" | ❌ 做不到 | ✅ 时间线遍历 |

### 4.2 架构对比

| 维度 | 纯向量 | + GraphRAG |
|------|--------|-----------|
| 检索源 | 3 个 | 4 个 |
| 节点类型 | 无 | 9 种 |
| 关系类型 | 无 | 10 种 |
| 新增依赖 | 无 | neo4j-driver + graphology |
| 新增部署 | 无 | 生产无（内存图） |

---

## 五、踩坑记录

### 5.1 graphology 类型兼容

`StandardResume` 的类型定义仍是 `{zh, en}`，但 API 返回已压平为字符串。处理时用 `typeof` 判断：

```ts
const name = typeof value === 'string' ? value : (value as Record<string, string>).zh
```

### 5.2 Cypher 动态 ID

`MERGE` 需要唯一的变量名。用递增计数器生成：

```ts
let idCounter = 0
function uid(prefix: string): string { return `${prefix}${++idCounter}` }
```

### 5.3 内存图搜索

`graphology` 不支持 Cypher，`search()` 方法用图遍历替代：

```ts
// memory-graph-store.ts
async search(): Promise<GraphSearchResult[]> {
  const results = []
  for (const neighbor of this.graph.outNeighbors('person')) {
    results.push({ text: `${attrs.label}: ${attrs.name}`, score: 0.5, sourceType: 'graph' })
    // 二级遍历...
  }
  return results.slice(0, 20)
}
```

---

## 六、代码文件索引

| 文件 | 做什么 |
|------|--------|
| `graph/graph-store.interface.ts` | GraphStore 接口 |
| `graph/memory-graph-store.ts` | graphology 内存图实现 |
| `graph/neo4j-graph-store.ts` | neo4j-driver 实现 |
| `graph/graph-store.factory.ts` | 按 env 切换 |
| `graph/graph-sync.service.ts` | 动态 Cypher 生成 |
| `graph/graph-search.service.ts` | LLM → Cypher 查询 |
| `docker-compose.yml` | 新增 neo4j 服务 |
| `.env.example` | GRAPH_STORE_BACKEND + NEO4J_* |

---

> *昇哥 · 2026 年 7 月*  
> *90 后 JS 全栈 × AI 学习途中，把踩过的坑写下来*  
> *专注羽毛球，爱音乐，正在研究易经 🎵🏸*

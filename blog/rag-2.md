---
layout: post
title: 「JS全栈 AI Agent 学习」RAG篇②：RAG 怎么做？从切片到向量检索
date: 2026-03-24
---

> 🗺️ **「全栈 AI Agent 学习」系列**
>
> | 篇 | 主题 | 状态 |
> |----|------|------|
> | 第一篇 | 提示链 · 路由 · 并行化 | ✅ |
> | 第二篇 | 反思 · 工具使用 · 规划 | ✅ |
> | 第三篇 | 多智能体 · 记忆管理 · 学习适应 | ✅ |
> | RAG篇① | RAG 是什么？核心概念与完整流程 | ✅ |
> | **RAG篇②（本篇）** | **RAG 怎么做？从切片到向量检索** | ✅ |
> | RAG篇③ | RAG 怎么做好？意图、重排序与答案质量 | 🔜 |

---

## 写在前面

上一篇把 RAG 的概念说清楚了——先翻书，再答题，五步走完，三个角色各司其职。

这一篇，我们动手。

用一个真实的场景：**简历问答系统**。

为什么选简历？因为它足够真实——
简历是典型的私有知识，LLM 从没见过，
但用户可能会问各种问题："他会什么技术？""他在哪家公司做过安全项目？"

这一篇，我们把 RAG 的基础四步用代码跑起来：

- **切片（Chunking）**：把简历切成小块
- **向量化（Embedding）**：把每块变成数字坐标
- **向量存储（Vector Store）**：把坐标存起来
- **相似度检索（Similarity Search）**：找到最相关的块

走完这四步，一个能跑的基础 RAG 就有了。

---

## 一、场景：简历问答系统

假设我们有一份结构化的简历，YAML 格式：

```yaml
profile:
  name: "张三"
  title: "高级前端工程师"
  years: 8

skills:
  - "Vue2/Vue3"
  - "TypeScript"
  - "前端工程化"

experiences:
  - company: "某科技公司"
    company_id: "company_a"
    period: "2019-2023"
    projects:
      - id: "edr"
        name: "EDR 终端威胁侦测平台"
        description: "面向政企安全场景，负责前端架构与核心模块开发"
        tech_stack: ["Vue", "iView", "WebSocket"]
      - id: "lc"
        name: "LC 安全分析大屏"
        description: "结合 EDR 数据进行安全态势感知与可视化"
        tech_stack: ["Vue", "ECharts", "WebSocket"]
```

用户可能会问：
- "他会什么技术？"
- "他在某科技公司做过什么项目？"
- "他有安全相关的项目经验吗？"

问题是：简历内容可能有 3000+ 字，
不可能每次都把整份简历塞给 LLM——Token 消耗大，而且容易被无关信息干扰。

解法就是 RAG：**先精准找到相关的那几段，再给 LLM 看。**

---

## 二、第一步：切片（Chunking）

### 为什么要切片？

```
用户问："他会什么技术？"

不切片的做法：
  → 把整份简历（3000+ 字）都塞给 LLM
  → Token 消耗大
  → LLM 容易被无关信息带跑

切片后的做法：
  → 只把 skills 那一块（200 字）塞给 LLM
  → Token 省了 95%
  → 答案更精准
```

切片的本质，是**把"大海捞针"变成"在一个小盒子里找针"**。

### 两种切片策略

**策略一：固定长度切片**

最简单的做法，按字数切：

```javascript
function chunkByLength(text, chunkSize = 500, overlap = 50) {
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize - overlap) {
    chunks.push(text.slice(i, i + chunkSize))
  }
  return chunks
}
```

`overlap` 是重叠区域——相邻两块之间保留 50 个字的重叠，
防止一句话被切断，上下文断掉。

**优点：** 简单，三行代码搞定。
**缺点：** 可能切断语义，"正式员工每年享有 10 天——"，切到这里就断了。

---

**策略二：语义切片（推荐）**

如果文档本身有结构（比如 YAML 简历），
天然就是好的切片单位——按结构切，语义完整，不会断。

```javascript
function chunkByStructure(resumeYaml) {
  const chunks = []

  // chunk 1：基本信息
  chunks.push({
    id: 'chunk_profile',
    section: 'profile',
    content: formatProfile(resumeYaml.profile),
    metadata: { type: 'profile' }
  })

  // chunk 2：技能
  chunks.push({
    id: 'chunk_skills',
    section: 'skills',
    content: formatSkills(resumeYaml.skills),
    metadata: { type: 'skills' }
  })

  // chunk 3～N：每个项目一个 chunk
  resumeYaml.experiences.forEach(exp => {
    exp.projects.forEach(project => {
      chunks.push({
        id: `chunk_project_${project.id}`,
        section: 'project',
        title: project.name,
        content: formatProject(project),
        metadata: {
          type: 'project',
          company: exp.company_id,
          company_name: exp.company,
          tech_stack: project.tech_stack,
          period: exp.period
        }
      })
    })
  })

  return chunks
}
```

切出来的结果长这样：

```javascript
[
  {
    id: "chunk_profile",
    section: "profile",
    content: "张三，高级前端工程师，8年经验...",
    metadata: { type: "profile" }
  },
  {
    id: "chunk_skills",
    section: "skills",
    content: "掌握 Vue2/Vue3、TypeScript、前端工程化...",
    metadata: { type: "skills" }
  },
  {
    id: "chunk_project_edr",
    section: "project",
    title: "EDR 终端威胁侦测平台",
    content: "面向政企安全场景，负责前端架构与核心模块开发...",
    metadata: {
      type: "project",
      company: "company_a",
      company_name: "某科技公司",
      tech_stack: ["Vue", "iView", "WebSocket"]
    }
  }
  // ...更多项目
]
```

> 注意 `metadata` 字段——公司、类型、技术栈这些结构化信息，
> 后面做过滤检索时会用到。先存进去，不亏。

---

## 三、第二步：向量化（Embedding）

### 把文字变成坐标

切完片，每一块都是一段文字。
但计算机不懂文字，要把它变成数字，才能计算"谁和谁更像"。

```
"掌握 Vue2/Vue3、TypeScript、前端工程化..."
    ↓ Embedding 模型
[0.23, -0.15, 0.87, ..., 0.42]  （1536 维）
```

这串数字就是这段文字的"语义坐标"——
意思相近的文字，坐标也会靠得很近。

### 实现代码

调用 OpenAI 的 Embedding API：

```javascript
async function embedText(text) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text
    })
  })

  const data = await response.json()
  return data.data[0].embedding  // 返回 1536 维向量
}

// 批量向量化所有 chunks
async function embedAllChunks(chunks) {
  for (const chunk of chunks) {
    chunk.vector = await embedText(chunk.content)
    // 每个 chunk 现在多了一个 vector 字段
  }
  return chunks
}
```

> 这一步是整个流程里**唯一需要调用付费 API** 的地方（向量化阶段）。
> 好消息是：向量化只需要做一次，结果存起来，后续查询复用。
> 简历这种小场景，15 个 chunks，费用可以忽略不计。

---

## 四、第三步：向量存储（Vector Store）

### 存什么？

每个 chunk 向量化之后，需要把三样东西一起存起来：

```
原文内容   → 最后给 LLM 看的
向量       → 用来计算相似度
元数据     → 用来过滤（公司、类型、技术栈……）
```

### 存哪里？

对于简历这种小规模场景（15 个 chunks），用 JSON 文件就够了，
不需要上 Pinecone、Weaviate 这些向量数据库。

存储格式：

```json
{
  "chunks": [
    {
      "id": "chunk_skills",
      "title": "专业技能",
      "section": "skills",
      "content": "掌握 HTML、CSS、JavaScript...",
      "vector": [0.23, -0.15, 0.87, ..., 0.42],
      "metadata": {
        "type": "skills",
        "length": 250
      }
    },
    {
      "id": "chunk_project_edr",
      "title": "EDR 终端威胁侦测平台",
      "section": "project",
      "content": "面向政企安全场景...",
      "vector": [0.19, -0.11, 0.91, ..., 0.38],
      "metadata": {
        "type": "project",
        "company": "company_a",
        "tech_stack": ["Vue", "iView", "WebSocket"]
      }
    }
  ]
}
```

### 实现代码

```javascript
import fs from 'fs/promises'

class VectorStore {
  constructor() {
    this.chunks = []
  }

  // 添加 chunks
  addChunks(chunks) {
    this.chunks.push(...chunks)
  }

  // 保存到文件
  async save(filepath) {
    const data = JSON.stringify({ chunks: this.chunks }, null, 2)
    await fs.writeFile(filepath, data, 'utf-8')
    console.log(`✅ 已保存 ${this.chunks.length} 个 chunks 到 ${filepath}`)
  }

  // 从文件加载
  async load(filepath) {
    const data = await fs.readFile(filepath, 'utf-8')
    const parsed = JSON.parse(data)
    this.chunks = parsed.chunks
    console.log(`✅ 已加载 ${this.chunks.length} 个 chunks`)
  }
}
```

> 向量化一次，存起来，后续每次查询直接加载——不需要重复调用 Embedding API。
> 这是 RAG 系统设计里很重要的一个点：**构建阶段和查询阶段分开**。

---

## 五、第四步：相似度检索（Similarity Search）

### 流程

用户问了一个问题，系统怎么找到最相关的 chunks？

```
用户问："他做过什么安全相关的项目？"

1. 把问题向量化
   → [0.31, -0.22, 0.76, ..., 0.55]

2. 遍历所有 chunks，计算相似度
   chunk_skills:          0.45
   chunk_project_edr:     0.89  ← 最高！
   chunk_project_lc:      0.78
   chunk_project_admin:   0.52
   ...

3. 返回 Top 3
   [
     { id: "chunk_project_edr", score: 0.89 },
     { id: "chunk_project_lc",  score: 0.78 },
     { id: "chunk_project_admin", score: 0.52 }
   ]
```

### 余弦相似度

计算两个向量"有多像"，用的是**余弦相似度**：

```javascript
function cosineSimilarity(vecA, vecB) {
  // 点积：两个向量对应维度相乘再相加
  let dotProduct = 0
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
  }

  // 各自的模长
  const normA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
  const normB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))

  // 余弦相似度 = 点积 / (模长A × 模长B)
  return dotProduct / (normA * normB)
}
```

结果在 -1 到 1 之间：
- **1**：完全相同
- **0**：完全不相关
- **-1**：完全相反（语义上）

实际场景里，相关内容通常在 0.7 以上。

### 向量搜索实现

```javascript
async function vectorSearch(query, vectorStore, topK = 3) {
  // 1. 把问题向量化
  const queryVector = await embedText(query)

  // 2. 遍历所有 chunks，计算相似度
  const results = vectorStore.chunks.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.vector)
  }))

  // 3. 按相似度排序，返回 Top K
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}
```

### 基础生成：把检索结果给 LLM

有了最相关的 chunks，最后一步是构造 Prompt，让 LLM 生成回答：

```javascript
async function generateAnswer(userQuery, chunks) {
  // 把检索到的内容拼成上下文
  const context = chunks
    .map((chunk, i) => `[来源 ${i + 1}] ${chunk.content}`)
    .join('\n\n---\n\n')

  const prompt = `
你是一个简历助手，根据以下信息回答用户问题。

【相关信息】
${context}

【用户问题】
${userQuery}

【回答要求】
1. 只根据提供的信息回答
2. 如果信息不足，说"简历中未提及"
3. 保持客观，不要编造
`

  return await callLLM(prompt)
}
```

---

## 六、把四步串起来

构建阶段（只做一次）：

```javascript
async function buildVectorStore(resumeYaml) {
  // 第一步：切片
  const chunks = chunkByStructure(resumeYaml)
  console.log(`📄 切出 ${chunks.length} 个 chunks`)

  // 第二步：向量化
  await embedAllChunks(chunks)
  console.log(`🔢 向量化完成`)

  // 第三步：存储
  const store = new VectorStore()
  store.addChunks(chunks)
  await store.save('./vectors.json')

  return store
}
```

查询阶段（每次问答都走）：

```javascript
async function ask(userQuery, vectorStore) {
  console.log(`\n📝 用户问题：${userQuery}`)

  // 第四步：检索
  const topChunks = await vectorSearch(userQuery, vectorStore, 3)
  console.log(`🔍 检索到 Top 3：`, topChunks.map(c => c.id))

  // 生成回答
  const answer = await generateAnswer(userQuery, topChunks)
  console.log(`\n💬 答案：${answer}`)

  return answer
}

// 使用
const store = new VectorStore()
await store.load('./vectors.json')   // 加载已构建好的向量库

await ask("他会什么技术？", store)
await ask("他做过什么安全相关的项目？", store)
```

运行起来，输出大概长这样：

```
📝 用户问题：他做过什么安全相关的项目？
🔍 检索到 Top 3：['chunk_project_edr', 'chunk_project_lc', 'chunk_project_admin']

💬 答案：
他做过两个安全相关的项目：

1. EDR 终端威胁侦测平台
   面向政企安全场景，负责前端架构与核心模块开发，
   使用 Vue + iView + WebSocket 实现终端信息监控和威胁侦测功能。

2. LC 安全分析大屏
   结合 EDR 数据进行安全态势感知与可视化，
   实现 ATT&CK 热力图等功能。
```

---

## 七、学到这里，我的几个感悟

### 构建和查询要分开

向量化只需要做一次，存起来复用。
每次用户提问，只需要加载已有的向量库，不需要重新向量化整份简历。

这个"**构建阶段 vs 查询阶段**"的分离，是 RAG 系统设计里很重要的一个思路——
和前端里"构建时处理 vs 运行时处理"的思路完全一致。

### 语义切片比固定切片值钱

固定长度切片简单，但容易切断语义。
如果文档本身有结构（YAML、Markdown 标题、JSON），优先按结构切。

切片的质量，直接决定检索的质量。
后面再怎么优化检索算法，切片切烂了，上限就在那里。

### metadata 要提前设计好

每个 chunk 的 `metadata` 字段——公司、类型、技术栈——
现在看起来只是"顺手存的信息"，但下一篇做意图提取和混合检索时，
它们会变成过滤条件，直接影响检索准确率。

先把结构设计好，后面扩展不费力。

### 余弦相似度不神秘

看到公式可能会有点怵，但实现出来就是那几行代码。

核心就一句话：**两个向量方向越接近，余弦值越大，说明语义越相似。**

不需要完全理解数学原理，知道"它在算什么"就够了。

---

## 总结

这一篇，我们把 RAG 基础四步用代码跑了一遍：

| 步骤 | 做了什么 | 关键点 |
|------|---------|--------|
| 切片 | 把简历按结构切成小块 | 语义切片 > 固定长度切片 |
| 向量化 | 每块文字变成数字坐标 | 只做一次，结果复用 |
| 向量存储 | 原文 + 向量 + 元数据一起存 | metadata 要提前设计好 |
| 相似度检索 | 余弦相似度，找 Top K | 语义检索，不是关键词匹配 |

到这里，一个能跑的基础 RAG 已经有了。

但"能跑"和"好用"之间，还有一段距离——

纯向量搜索有个明显的问题：
用户问"他在**某科技公司**做过什么项目"，
但检索结果里可能混进来其他公司的项目。

向量相似度只能衡量"语义像不像"，
但没办法处理"公司""时间段"这类结构化过滤条件。

这就是下一篇要解决的问题——

---

## 下一篇预告

**RAG篇③：RAG 怎么做好？意图提取、重排序与答案质量**

- 意图提取：把自然语言问题转化为结构化查询
- 混合检索：向量搜索 + 元数据过滤，准确率从 67% → 100%
- 重排序：多维度打分，再提升一层
- 答案生成：怎么让 LLM 不乱编，答案有来源可查
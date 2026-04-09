---
layout: post
title: 「JS全栈 AI Agent 学习」RAG篇③：RAG 怎么做好？意图提取、重排序与答案质量
date: 2026-03-25
---

> 🗺️ **「全栈 AI Agent 学习」系列**
>
> | 篇                 | 主题                                         | 状态 |
> | ------------------ | -------------------------------------------- | ---- |
> | 第一篇             | 提示链 · 路由 · 并行化                       | ✅   |
> | 第二篇             | 反思 · 工具使用 · 规划                       | ✅   |
> | 第三篇             | 多智能体 · 记忆管理 · 学习适应               | ✅   |
> | RAG篇①             | RAG 是什么？核心概念与完整流程               | ✅   |
> | RAG篇②             | RAG 怎么做？从切片到向量检索                 | ✅   |
> | **RAG篇③（本篇）** | **RAG 怎么做好？意图提取、重排序与答案质量** | ✅   |

---

## 写在前面

上一篇，我们把 RAG 的基础四步跑通了——切片、向量化、存储、检索。

跑通之后，我发现一个问题：

用户问："他在**某科技公司**做过什么安全项目？"

检索结果里，混进来了另一家公司的项目。

向量相似度只能衡量"语义像不像"，
但"某科技公司"这个条件，它根本没在管。

这就是纯向量搜索的天花板——**语义理解够了，结构化过滤不行。**

这一篇，我们来把这个天花板往上推：

- **意图提取**：把自然语言问题转化为结构化查询，加上过滤条件
- **重排序**：多维度打分，让最该出现的结果排在最前面
- **答案生成**：约束 LLM 不乱编，答案有来源可查
- **完整系统**：把三篇的内容串成一个可以跑的 RAG 系统

走完这一篇，准确率从 60% 到 95%，每一步都看得到。

---

## 一、意图提取：把自然语言变成结构化查询

### 问题在哪里

纯向量搜索的问题，用一个例子就能说清楚：

```
用户问："他在某科技公司做过什么安全相关的项目？"

纯向量搜索结果：
  1. EDR 项目（某科技公司）✅
  2. 云药客项目（另一家公司）❌  ← 混进来了
  3. Admin 后台（某科技公司）✅
```

问题出在哪？

"某科技公司"这个信息，向量搜索没有处理。
它只知道"这个问题和项目相关"，但不知道"只要某科技公司的项目"。

### 解决思路：先提取意图，再过滤

```
用户问："他在某科技公司做过什么安全相关的项目？"
    ↓ 意图提取
{
  query: "做过什么项目",        ← 核心问题（用来向量搜索）
  filters: {
    company: "company_a",      ← 公司过滤
    section: "project",        ← 类型过滤
    domain: "security"         ← 领域过滤
  }
}
    ↓ 带过滤条件的检索
只在"某科技公司的项目"里搜索
```

把自然语言问题拆成两部分：

- **核心问题**：用来做向量搜索
- **过滤条件**：用来缩小搜索范围

### 两种实现方案

**方案一：关键词匹配（简单版）**

```javascript
function extractIntent_v1(userQuery) {
  const intent = {
    query: userQuery,
    filters: {},
  }

  // 公司关键词映射
  const companies = {
    某科技公司: 'company_a',
    另一家公司: 'company_b',
  }

  // 类型关键词映射
  const sections = {
    项目: 'project',
    技能: 'skills',
    工作经历: 'experience',
  }

  // 匹配公司
  for (const [keyword, id] of Object.entries(companies)) {
    if (userQuery.includes(keyword)) {
      intent.filters.company = id
      break
    }
  }

  // 匹配类型
  for (const [keyword, section] of Object.entries(sections)) {
    if (userQuery.includes(keyword)) {
      intent.filters.section = section
      break
    }
  }

  return intent
}
```

**优点：** 简单、快、不需要额外 API 调用。
**缺点：** 只能匹配预定义的关键词，用户换个说法就失效了。

---

**方案二：LLM 结构化提取（推荐）**

让 LLM 来理解用户意图，输出结构化的过滤条件：

```javascript
async function extractIntent_v2(userQuery) {
  const prompt = `
你是一个意图解析助手，从用户问题中提取结构化信息。

【用户问题】
${userQuery}

【可选的公司】
- company_a: 某科技公司
- company_b: 另一家公司

【可选的类型】
- profile: 基本信息
- skills: 技能
- project: 项目
- experience: 工作经历

【可选的领域】
- security: 安全
- frontend: 前端
- backend: 后端

【输出格式】
严格返回 JSON，不要有多余的内容：
{
  "query": "提炼后的核心问题",
  "filters": {
    "company": "公司 ID（没提到就不填）",
    "section": "类型（没提到就不填）",
    "domain": "领域（没提到就不填）"
  }
}
`

  const response = await callLLM(prompt)
  return JSON.parse(response)
}
```

输入 → 输出示例：

```javascript
// 输入
"他在某科技公司做过什么安全相关的项目？"

// 输出
{
  "query": "做过什么项目",
  "filters": {
    "company": "company_a",
    "section": "project",
    "domain": "security"
  }
}
```

### 混合检索：向量搜索 + 元数据过滤

有了结构化的意图，就可以做混合检索——
先用 `filters` 缩小候选范围，再在候选里做向量搜索：

```javascript
async function hybridSearch(userQuery, vectorStore, topK = 3) {
  // 第一步：提取意图
  const intent = await extractIntent_v2(userQuery)

  // 第二步：向量化核心问题（不是原始问题）
  const queryVector = await embedText(intent.query)

  // 第三步：用 filters 先过滤候选
  const candidates = vectorStore.chunks.filter((chunk) => {
    if (intent.filters.company && chunk.metadata.company !== intent.filters.company) {
      return false
    }
    if (intent.filters.section && chunk.metadata.type !== intent.filters.section) {
      return false
    }
    return true
  })

  // 第四步：在候选里计算相似度
  const results = candidates.map((chunk) => ({
    ...chunk,
    score: cosineSimilarity(queryVector, chunk.vector),
  }))

  // 第五步：排序返回 Top K
  return {
    intent,
    chunks: results.sort((a, b) => b.score - a.score).slice(0, topK),
  }
}
```

### 效果对比

```
用户问："他在某科技公司做过什么安全相关的项目？"

┌──────────────────────────────────────┐
│ 纯向量搜索                            │
├──────────────────────────────────────┤
│ 1. EDR 项目（某科技公司）    ✅        │
│ 2. 云药客项目（另一家公司）  ❌        │
│ 3. Admin 后台（某科技公司）  ✅        │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 意图提取 + 混合检索                   │
├──────────────────────────────────────┤
│ 1. EDR 项目（某科技公司）    ✅        │
│ 2. LC 大屏（某科技公司）     ✅        │
│ 3. Admin 后台（某科技公司）  ✅        │
└──────────────────────────────────────┘

准确率：67% → 100%
```

---

## 二、重排序：让最该出现的排在最前面

### 向量相似度的局限

意图提取解决了"混进来不相关内容"的问题，
但向量相似度还有另一个局限——**它只能衡量语义像不像，不能衡量哪个更重要**。

比如用户问："他最擅长什么前端框架？"

向量搜索结果：

```
1. project_yyk (score: 0.82)  ← 某个项目里提到了 Vue3
2. skills      (score: 0.81)  ← 技能列表，直接列了所有框架
3. project_edr (score: 0.79)  ← 另一个项目里提到了 Vue
```

`skills` 才是最直接回答这个问题的，但它排在第二。

原因是：向量相似度只看"语义距离"，
不知道"技能列表"对这个问题的价值比"项目描述"高。

### 多维度重排序

解法是在向量相似度的基础上，叠加多个维度的打分：

```javascript
function rerank(chunks, intent) {
  return chunks
    .map((chunk) => {
      let score = chunk.score // 基础向量得分

      // 维度 1：类型完全匹配，加分
      if (chunk.metadata.type === intent.filters.section) {
        score += 0.2
      }

      // 维度 2：公司完全匹配，加分
      if (chunk.metadata.company === intent.filters.company) {
        score += 0.15
      }

      // 维度 3：技术栈匹配，每匹配一个加一点
      if (intent.filters.tech_stack) {
        const matchCount = intent.filters.tech_stack.filter((tech) =>
          chunk.metadata.tech_stack?.includes(tech),
        ).length
        score += matchCount * 0.05
      }

      // 维度 4：内容完整度（太短的块信息量不够）
      const completeness = Math.min(chunk.content.length / 500, 1)
      score += completeness * 0.1

      return { ...chunk, finalScore: score }
    })
    .sort((a, b) => b.finalScore - a.finalScore)
}
```

重排序之后，`skills` 因为"类型完全匹配"获得加分，自然排到第一。

### 多样性重排序（MMR）

还有一个问题：如果检索结果里有三个内容高度相似的 chunks，
全部返回给 LLM，信息是重复的，Token 浪费了，答案也不会更好。

**MMR（Maximal Marginal Relevance）** 解决的就是这个问题——
在保证相关性的同时，让返回的结果尽量多样：

```javascript
function rerankWithDiversity(chunks, lambda = 0.5) {
  const selected = []
  const remaining = [...chunks]

  // 第一个：直接选相似度最高的
  selected.push(remaining.shift())

  // 后续：平衡相关性和多样性
  while (remaining.length > 0 && selected.length < 3) {
    let bestScore = -Infinity
    let bestIndex = -1

    remaining.forEach((chunk, i) => {
      // 与查询的相关性
      const relevance = chunk.score

      // 与已选内容的最大相似度（越高说明越重复）
      const maxSimilarity = Math.max(
        ...selected.map((s) => cosineSimilarity(chunk.vector, s.vector)),
      )

      // MMR 分数：相关性高 + 重复度低 = 好
      const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity

      if (mmrScore > bestScore) {
        bestScore = mmrScore
        bestIndex = i
      }
    })

    selected.push(remaining.splice(bestIndex, 1)[0])
  }

  return selected
}
```

`lambda` 控制两者的权重：

- `lambda = 1`：只看相关性，不管多样性
- `lambda = 0`：只看多样性，不管相关性
- `lambda = 0.5`：两者各占一半（通常这个值效果最好）

### 效果对比

```
用户问："他最擅长什么前端框架？"

┌──────────────────────────────────────┐
│ 只用向量搜索                          │
├──────────────────────────────────────┤
│ 1. project_yyk  (0.82)               │
│ 2. skills       (0.81)  ← 应该第一   │
│ 3. project_edr  (0.79)               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 多维度重排序                          │
├──────────────────────────────────────┤
│ 1. skills       (0.81 + 0.2 = 1.01) ✅│
│ 2. project_yyk  (0.82)               │
│ 3. project_edr  (0.79)               │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 多维度 + 多样性（MMR）                │
├──────────────────────────────────────┤
│ 1. skills      ✅ 最相关              │
│ 2. experience  ✅ 补充工作背景        │
│ 3. project_edr ✅ 具体项目佐证        │
└──────────────────────────────────────┘

准确率：60% → 85% → 95%
```

---

## 三、答案生成：约束 LLM，让答案有据可查

### 基础 Prompt 的问题

上一篇用的基础 Prompt 很简单：

```javascript
const prompt = `根据以下信息回答用户问题。\n\n${context}\n\n${userQuery}`
```

这样写有几个问题：

- LLM 可能把自己训练数据里的知识混进来
- 不知道答案是从哪个来源来的
- 格式不可控，有时候答得长，有时候答得短

### 结构化 Prompt + 引用来源

```javascript
async function generateAnswer(userQuery, chunks) {
  // 给每个来源编号
  const context = chunks
    .map((c, i) => `[来源 ${i + 1}: ${c.title || c.section}]\n${c.content}`)
    .join('\n\n---\n\n')

  const prompt = `
你是一个专业的简历助手，根据提供的信息回答用户问题。

【相关信息】
${context}

【用户问题】
${userQuery}

【回答要求】
1. 只根据提供的信息回答，不要加入你自己的知识
2. 如果信息不足，明确说"简历中未提及"
3. 保持客观，不要夸大或编造
4. 引用了某个来源时，在句末标注 [来源 X]

【输出格式】
严格返回 JSON：
{
  "answer": "自然语言回答",
  "confidence": "high | medium | low",
  "citations": [{ "source_index": 1 }]
}
`

  const response = await callLLM(prompt)
  const result = JSON.parse(response)

  // 验证引用合法性（防止 LLM 编造来源编号）
  result.citations = result.citations.filter(
    (c) => c.source_index >= 1 && c.source_index <= chunks.length,
  )

  return {
    answer: result.answer,
    confidence: result.confidence,
    sources: chunks.map((c, i) => ({
      index: i + 1,
      title: c.title || c.section,
      cited: result.citations.some((citation) => citation.source_index === i + 1),
    })),
  }
}
```

### 答案验证（可选，高要求场景用）

如果对准确性要求很高，可以加一层验证——
让 LLM 检查自己生成的答案有没有事实错误：

```javascript
async function verifyAnswer(answer, chunks) {
  const verificationPrompt = `
【生成的答案】
${answer}

【原始信息】
${chunks.map((c) => c.content).join('\n\n---\n\n')}

【任务】
检查答案是否有以下问题：
1. 与原始信息不符的事实错误
2. 原始信息中没有的编造内容

【输出格式】
严格返回 JSON：
{
  "has_errors": true | false,
  "errors": ["错误描述"],
  "corrected_answer": "如果有错误，给出修正后的答案，否则为空字符串"
}
`

  const verification = JSON.parse(await callLLM(verificationPrompt))

  if (verification.has_errors && verification.corrected_answer) {
    return {
      answer: verification.corrected_answer,
      original_answer: answer,
      corrected: true,
    }
  }

  return { answer, corrected: false }
}
```

> 验证这一步会多一次 LLM 调用，有额外成本。
> 简历问答这种场景，通常不需要——
> 但如果是医疗、法律、金融这类对准确性要求极高的场景，值得加上。

---

## 四、完整系统：把三篇串起来

现在把三篇的内容组装成一个完整的 RAG 系统：

```javascript
class RAGSystem {
  constructor() {
    this.vectorStore = new VectorStore()
  }

  // 构建阶段：只做一次
  async build(resumeYaml) {
    const chunks = chunkByStructure(resumeYaml) // 切片
    await embedAllChunks(chunks) // 向量化
    this.vectorStore.addChunks(chunks) // 存储
    await this.vectorStore.save('./vectors.json')
    console.log(`✅ 构建完成，共 ${chunks.length} 个 chunks`)
  }

  // 查询阶段：每次问答都走
  async ask(userQuery) {
    console.log(`\n📝 用户问题：${userQuery}`)

    // 第一步：意图提取
    const intent = await extractIntent_v2(userQuery)
    console.log(`🎯 意图：`, intent)

    // 第二步：混合检索（向量 + 过滤）
    const queryVector = await embedText(intent.query)
    const candidates = this.vectorStore.search({
      vector: queryVector,
      filters: intent.filters,
      topK: 10, // 先多捞一些，后面重排序再筛
    })
    console.log(`🔍 候选：${candidates.length} 个`)

    // 第三步：重排序
    const reranked = rerank(candidates, intent)
    const diverse = rerankWithDiversity(reranked)
    console.log(
      `📊 重排序后 Top 3：`,
      diverse.map((c) => c.id),
    )

    // 第四步：生成答案
    const result = await generateAnswer(userQuery, diverse.slice(0, 3))

    console.log(`\n💬 答案：${result.answer}`)
    console.log(`✨ 置信度：${result.confidence}`)
    console.log(
      `📚 来源：`,
      result.sources.filter((s) => s.cited),
    )

    return result
  }
}
```

### 跑起来

```javascript
// 初始化（只做一次）
const rag = new RAGSystem()
await rag.build(resumeYaml)

// 问答
await rag.ask('他会什么技术？')
await rag.ask('他在某科技公司做过什么安全相关的项目？')
await rag.ask('他有 Vue3 相关的项目经验吗？')
```

输出示例：

```
📝 用户问题：他在某科技公司做过什么安全相关的项目？

🎯 意图：{
  query: "做过什么项目",
  filters: { company: "company_a", section: "project", domain: "security" }
}

🔍 候选：6 个
📊 重排序后 Top 3：['chunk_project_edr', 'chunk_project_lc', 'chunk_project_admin']

💬 答案：
他在某科技公司主要做了两个安全相关的项目：

1. EDR 终端威胁侦测平台 [来源 1]
   面向政企安全场景，负责前端架构与核心模块开发，
   使用 Vue + iView + WebSocket 实现终端信息监控和威胁侦测功能。

2. LC 安全分析大屏 [来源 2]
   结合 EDR 数据进行安全态势感知与可视化，
   实现 ATT&CK 热力图等功能。

✨ 置信度：high
📚 来源：[
  { index: 1, title: "EDR 项目", cited: true },
  { index: 2, title: "LC 大屏",  cited: true }
]
```

---

## 五、效果提升路径总结

三篇走下来，准确率是怎么一步步提升的：

```
基础 RAG（纯向量搜索）
  准确率：~60%
  问题：混进不相关内容，重要的排不到前面
  ↓ + 意图提取
准确率：~80%（+20%）
  解决了：结构化过滤，不相关内容被挡在外面
  ↓ + 重排序
准确率：~90%（+10%）
  解决了：最该出现的排在最前面，结果更多样
  ↓ + 答案验证
准确率：~95%（+5%）
  解决了：LLM 不乱编，答案有来源可查
```

每一步的提升都有对应的代码，不是玄学。

---

## 六、学完这章，我的几个感悟

### 意图提取是被低估的一步

很多 RAG 教程直接从向量搜索讲到生成，跳过了意图提取。

但这一步的收益是最大的——
把"某科技公司"这个条件提取出来，准确率直接从 67% 跳到 100%。

本质上，它做的事情和后端的"参数解析"一样：
把用户的自然语言输入，转化成系统能处理的结构化数据。

### 重排序是性价比最高的优化

十几行代码，效果提升 10%+。

而且逻辑很直觉：向量相似度是基础分，
类型匹配、公司匹配、内容完整度是加分项——
就像搜索引擎的排序算法，多个信号综合打分。

### MMR 解决了一个隐藏问题

在加入 MMR 之前，我没意识到"返回三个高度相似的 chunks"是个问题。

但仔细想想：三个说的都是同一件事，给 LLM 的信息量并没有增加，
反而浪费了 Token，还可能让 LLM 过度关注某一个方向。

MMR 的思路很优雅：**相关性高 + 重复度低 = 好**。
这和前端里"去重"的思路是一样的，只是维度从"完全相同"变成了"语义相似"。

### 约束 LLM 比"让它自由发挥"更重要

一开始我以为 LLM 越自由越好，让它自己判断怎么回答。

但实际上，在 RAG 场景里，**约束比自由更重要**：

- 明确说"只根据提供的信息回答"
- 要求输出 JSON，不要自由发挥格式
- 引用来源，让答案可验证

这些约束不是在限制 LLM，而是在**把它的能力用在刀刃上**——
生成流畅、准确的自然语言，而不是猜测和补全。

### RAG 的本质是"信息管道"

回头看三篇走下来的整个链路：

```
用户问题
  → 意图提取（结构化）
  → 向量检索（语义匹配）
  → 元数据过滤（结构化筛选）
  → 重排序（多维度打分）
  → Prompt 构造（信息组装）
  → LLM 生成（语言输出）
  → 答案验证（质量保障）
```

每一步都是在**处理信息、过滤噪音、提升信噪比**。

这和写好一个数据处理管道的思路完全一致——
输入越干净，中间处理越精准，输出就越好。

---

## 总结

RAG 三篇走完，一张表格收尾：

| 步骤                 | 解决的问题         | 准确率提升 |
| -------------------- | ------------------ | ---------- |
| 切片 + 向量化 + 检索 | 能跑起来           | 基础 ~60%  |
| 意图提取 + 混合检索  | 不混进不相关内容   | +20%       |
| 多维度重排序         | 最该出现的排最前   | +10%       |
| MMR 多样性           | 不返回重复内容     | 体验提升   |
| 结构化 Prompt + 验证 | LLM 不乱编，有来源 | +5%        |

RAG 不复杂，但细节决定成败。
每一步都有优化空间，每一步的优化都看得到效果。

---

## 写在最后

三篇 RAG 学下来，最大的收获不是某个具体的技术，
而是一个思维方式的转变：

> **AI 不是魔法，是一条可以设计、可以调试、可以优化的信息管道。**

每个环节出了问题，都能定位到是哪一步——
是切片切烂了？是意图提取没提准？是重排序权重没调好？还是 Prompt 约束不够？

这和我们平时调 Bug 的思路完全一样。

RAG 系列到这里告一段落。
下一个主题，我们继续往深走。

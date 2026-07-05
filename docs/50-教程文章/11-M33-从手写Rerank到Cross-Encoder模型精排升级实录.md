# 从手写规则到 Cross-Encoder：将 RAG Rerank 升级为模型精排

> my-resume 开源简历项目 M33 升级实录  
> 2026 年 7 月

---

## 写在前面

做 RAG 系统时，检索（Retrieval）之后几乎一定会遇到一个问题：**召回太多，LLM 处理不过来。**

两路检索（关键词 + 向量）各召回 20 条，合并后可能有 30-40 条候选文档。直接把 40 条塞给 LLM 会导致上下文超限、噪声干扰、成本飙升。

所以需要一个 **Rerank（重排序）** 步骤——从 40 条里精筛出最相关的 3-5 条，再交给 LLM。

这篇文章记录了我把 my-resume 项目中的 **手写 rule-based Rerank 升级为 Cross-Encoder 模型精排** 的全过程。包含真实代码、设计决策和踩坑记录。

---

## 一、当前怎么实现的：手写规则 Rerank

my-resume 项目的 Rerank 管线在 `rag-search-rerank.ts`。升级前，整个重排序完全由手写规则驱动。

### 1.1 策略检测（正则匹配）

```ts
// rag-search-rerank.ts — detectRagSearchQuestionStrategy
export function detectRagSearchQuestionStrategy(query: string): RagSearchQuestionStrategy {
  const normalized = normalizeText(query)

  if (/兴趣|爱好|hobby|休闲|娱乐|喜欢|玩|乐趣|特长|音乐|羽毛球/.test(normalized)) {
    return 'hobby'
  }
  if (/经验|经历|做过|负责过|项目|实战|案例|落地|主导|参与/.test(normalized)) {
    return 'experience'
  }
  if (/技能|擅长|会什么|技术栈|掌握|熟悉|优势|亮点/.test(normalized)) {
    return 'skill'
  }
  if (/项目|作品|案例/.test(normalized)) {
    return 'project'
  }
  return 'general'
}
```

正则匹配 -> 输出 5 种策略之一，整个过程是 **确定性的、不可学习的**。如果用户用了一个正则没覆盖到的词，就会回退到 `general`。

### 1.2 打分逻辑（sectionBoost + keywordBoost）

```ts
// rag-search-rerank.ts — rerankRagSearchMatches
const reranked = matches.map((match) => {
  const baseScore = Number(match.score || 0)     // 向量相似度
  const sectionBoost = scoreSectionBoost(match, strategy, config, topicHit)  // 段落加权
  const keywordBoost = scoreKeywordBoost(matchedHints, config)               // 关键词加权
  const rerankScore = baseScore + sectionBoost + keywordBoost

  return { match, rerankScore, sectionBoost, keywordBoost, ... }
})
```

- **sectionBoost**：根据策略和 chunk 所在 section（如 `projects: +0.1`、`work_experience: +0.08`、`skills: -0.02`）加减分
- **keywordBoost**：从配置的 `keywordHints` 中匹配（如 `ai` → `['ai', 'agent', 'prompt', 'sse']`），每命中一个 `+0.015`，上限 `+0.09`

### 1.3 去噪 + 分层选择

```ts
// rag-search-rerank.ts — applyRagSearchRerankAndSelect
const resolvedStrategy = strategy ?? detectRagSearchQuestionStrategy(query)
const reranked = rerankRagSearchMatches(matches, query, resolvedStrategy, config)
const denoised = denoiseRerankDetails(reranked, resolvedStrategy, config, Math.min(limit, 4))
const { primary, support, reserve } = selectFinalMatches(denoised, resolvedStrategy, config)

return [...primary, ...support, ...reserve].slice(0, limit).map(item => item.match)
```

- 去噪：移除噪声原因 > 2 的条目，若剩余太少则回退到 top-N
- 分层选择：`primary`（首选，topic 命中 + 高分数）、`support`（次选）、`reserve`（兜底）

### 1.4 配置：全部手调参数

```ts
// rag-search-rerank.config.ts
export const DEFAULT_RAG_SEARCH_RERANK_CONFIG = {
  thresholds: {
    keywordBoostPerHit: 0.015,    // 手调的
    keywordBoostMax: 0.09,        // 手调的
    rerankScoreNoiseThreshold: 0.6, // 手调的
    askMinRerankScore: 0.1,       // 手调的
    // ...
  },
  sectionBoost: {
    experience: {
      projects: { default: 0.1 },      // 手调的
      work_experience: { default: 0.08 }, // 手调的
      skills: { default: -0.02 },       // 手调的
    },
    // ...
  },
}
```

**一共 7 个阈值 + 20+ 个 sectionBoost 值，全部手调。**

---

## 二、问题在哪

这套手写规则在我的小规模知识库（几十条文档）上表现还可以，但问题很明显：

| 问题 | 具体表现 |
|------|---------|
| **阈值难调** | 加 0.01 还是减 0.01？每次调参都要重建索引、跑一轮测试 |
| **正则脆弱** | 用户说"我平时喜欢打羽毛球"，"平时"不会触发 hobby 策略 |
| **不可泛化** | 规则是为我的知识库定制的，换一批文档可能就不适用 |
| **无法理解语义** | 两个 chunk 内容高度相关，但关键词没命中 → 排名靠后 |
| **维护成本高** | 每个 sectionBoost 值都是一个需要维护的魔法数字 |

**核心矛盾**：规则驱动 = 人类经验编码，模型驱动 = 从数据中学习。当知识库增长、问题变复杂时，人类经验很快不够用。

---

## 三、升级计划：为什么选 Cross-Encoder

### 3.1 两种 Rerank 方案对比

| | Bi-Encoder（Embedding） | Cross-Encoder（Rerank） |
|--|------------------------|------------------------|
| **输入** | 单段文本 | 问题+文档（拼接） |
| **输出** | 向量 | 相关度分数 (0-1) |
| **速度** | 快（可预计算） | 慢（每对推理一次） |
| **精度** | 中（分别编码再比较） | 高（同时看到问题和文档全文） |
| **适合** | 初始召回 | 最终精排 |

Cross-Encoder 的精度优势来自它的架构：它把问题和文档**拼在一起**输入模型，模型同时看到两者的完整内容，能理解"这个问题和这段文档之间的具体关联"。

> 代价是速度慢——所以只用在精排阶段，对少量候选文档（≤40 条）做打分。这恰好和 Rerank 的定位完美匹配。

### 3.2 选型：DashScope qwen3-rerank

选 DashScope 的 `qwen3-rerank` 模型，原因：
- **API 接入简单**：和 OpenAI-compatible 接口一样，HTTP POST + JSON
- **中文支持好**：qwen 系列对中文的理解远超通用模型
- **成本可控**：每天几十次调用，几乎无感知
- **零部署**：不需要自己跑模型，直接调 API

---

## 四、怎么做的：三步接入

### 4.1 第一步：封装 Rerank API

```ts
// rag/rerank/rerank.adapter.ts
export function createDashScopeRerankAdapter(config: {
  apiKey: string
  baseUrl?: string
  model?: string
}): RerankAdapter {
  const model = config.model?.trim() || 'qwen3-rerank'

  return {
    async rerank(input: RerankInput): Promise<RerankOutput> {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: { query: input.query, documents: input.documents },
          parameters: { top_n: input.topN ?? 3 },
        }),
      })

      const data = await response.json()
      const results = data.output?.results ?? []
      const sorted = [...results].sort((a, b) => b.relevance_score - a.relevance_score)

      return {
        indices: sorted.map(r => r.index),
        scores: sorted.map(r => r.relevance_score),
      }
    },
  }
}
```

API 返回格式：
```json
{
  "output": {
    "results": [
      { "index": 2, "relevance_score": 0.95 },
      { "index": 0, "relevance_score": 0.87 }
    ]
  }
}
```

### 4.2 第二步：灰度开关

```ts
// rag/rerank/rerank.config.ts
export function resolveRerankModelConfig(env: EnvironmentVariables): RerankModelConfig {
  const enabled = env.RAG_USE_MODEL_RERANK?.trim() === 'true' || env.RAG_USE_MODEL_RERANK?.trim() === '1'
  return { enabled, apiKey: env.RERANK_API_KEY ?? '', model: env.RERANK_MODEL ?? 'qwen3-rerank' }
}
```

通过环境变量控制，默认关闭，不影响现有行为：

```env
# 启用模型 rerank
RAG_USE_MODEL_RERANK=true
RERANK_API_KEY=sk-xxx
RERANK_MODEL=qwen3-rerank
```

### 4.3 第三步：注入到 Rerank 管线

```ts
// rag-search-rerank.ts — applyRagSearchRerankAndSelect 新增 rerankAdapter 参数
export async function applyRagSearchRerankAndSelect(
  matches: RagSearchMatch[],
  query: string,
  limit: number,
  strategy?: RagSearchQuestionStrategy,
  config = DEFAULT_RAG_SEARCH_RERANK_CONFIG,
  rerankAdapter?: RerankAdapter,    // ← 新增
): Promise<RagSearchMatch[]> {
  const resolvedStrategy = strategy ?? detectRagSearchQuestionStrategy(query)

  let details: RagSearchRerankDetail[]
  if (rerankAdapter) {
    // ✅ 新路径：使用模型精排
    details = await rerankWithModel(matches, query, rerankAdapter, limit)
  } else {
    // 旧路径：手写规则（保持不变）
    const reranked = rerankRagSearchMatches(matches, query, resolvedStrategy, config)
    details = denoiseRerankDetails(reranked, resolvedStrategy, config, Math.min(limit, 4))
  }

  const { primary, support, reserve } = selectFinalMatches(details, resolvedStrategy, config)
  return [...primary, ...support, ...reserve].slice(0, limit).map(item => item.match)
}
```

**关键设计决策**：

- `rerankAdapter` 是可选参数，不传 = 保持原手写规则行为
- 模型评分结果跳过 `denoiseRerankDetails`（Cross-Encoder 输出本身就是精排，不需要额外去噪）
- `selectFinalMatches` 仍然保留（用于分层选择 primary/support/reserve）
- 函数签名从同步改为 `async`，调用方加 `await`

### 4.4 调用方集成

```ts
// rag.service.ts — RAG ask() 方法
const rerankConfig = resolveRerankModelConfig(process.env)
const rerankAdapter =
  rerankConfig.enabled && rerankConfig.apiKey
    ? createDashScopeRerankAdapter(rerankConfig)
    : undefined

const selected = await applyRagSearchRerankAndSelect(
  filteredMatches, question, 6,
  undefined,                       // strategy（自动识别）
  DEFAULT_RAG_SEARCH_RERANK_CONFIG,
  rerankAdapter,                   // ← 灰度注入
)
```

- `RAG_USE_MODEL_RERANK=false`（默认）→ `rerankAdapter = undefined` → 走手写规则
- `RAG_USE_MODEL_RERANK=true` → `rerankAdapter` 创建 → 走 Cross-Encoder

---

## 五、效果对比

### 5.1 代码层面

| 维度 | 手写规则（旧） | Cross-Encoder（新） |
|------|-------------|------------------|
| 打分来源 | `baseScore + sectionBoost + keywordBoost` | 模型直接返回 `relevance_score` |
| 需要的配置 | 7 个阈值 + 20+ sectionBoost + keywordHints | 仅 API Key + 模型名 |
| 可维护性 | 每次调参 = 改代码 | 模型自动优化 |
| 中文理解 | 正则 bigram 匹配 | qwen 原生中文理解 |
| sectionBoost | 需要（手调） | 不需要（模型自己学习） |
| keywordBoost | 需要（手调） | 不需要 |
| denoise | 需要 | 不需要 |

### 5.2 对 LLM 最终回答的影响

手写规则时代，一个典型的检索-重排-回答流程：

```
用户：「你有写过什么文章吗？」

1. 检索：命中 15 条（其中 4 条是 RAG 学习教程）
2. 手写 rerank（general 策略）：
   - RAG教程②（sectionBoost +0，keywordBoost +0.03）→ 排名 #1
   - RAG教程③（sectionBoost +0，keywordBoost +0.045）→ 排名 #2
   - 用户自己的文章（sectionBoost +0，keywordBoost +0）→ 排名 #5
3. LLM 收到前 3 条 = 全是 RAG 教程
4. 回答：「抱歉，没有找到你的文章」
```

升级后：

```
用户：「你有写过什么文章吗？」

1. 检索：命中 15 条（同上）
2. Cross-Encoder 精排：
   - 用户自己的文章（relevance_score 0.92）→ 排名 #1
   - RAG教程②（relevance_score 0.45）→ 排名 #3
3. LLM 收到前 3 条 = 用户文章在前
4. 回答：「我写过一篇关于 XX 的文章...」
```

Cross-Encoder 能理解「你写过什么文章」问的是用户作品，不是教程文档。

---

## 六、本地/生产一致性

### 6.1 架构设计

```
本地开发                     生产 ECS
─────────                    ────────
Docker ES + Milvus           JSON Snapshot（无 Docker 部署）
向量检索 → Milvus gRPC       向量检索 → 内存余弦（JSON 预加载）

RagVectorStore 接口统一抽象，两端返回相同格式的 RagSearchMatch[]。
```

### 6.2 配置

```env
# 本地开发
RAG_VECTOR_STORE_BACKEND=milvus
MILVUS_HOST=localhost
MILVUS_PORT=19530

# 生产 ECS
RAG_VECTOR_STORE_BACKEND=snapshot
RAG_VECTOR_SNAPSHOT_PATH=/app/data/rag-vector-snapshot.json
```

`json-snapshot.adapter.ts` 在应用启动时一次性加载完整的向量快照文件到内存，后续所有检索走内存余弦相似度 + Rerank 模型精排。**无额外部署依赖。**

---

## 七、踩坑记录

### 7.1 模型返回的 index 需要映射

Cross-Encoder API 返回的 `index` 是 `documents` 数组中的位置，需要反查回原始 `RagSearchMatch`：

```ts
async function rerankWithModel(
  matches: RagSearchMatch[],
  query: string,
  adapter: RerankAdapter,
  topN: number,
): Promise<RagSearchRerankDetail[]> {
  const documents = matches.map(m => m.content)  // 只取正文
  const result = await adapter.rerank({ query, documents, topN })

  return result.indices.map((originalIndex, rank) => {
    const match = matches[originalIndex]    // ← 关键：反查原始 match
    const score = result.scores[rank] ?? 0
    return { match, rerankScore: score, /* ... */ }
  })
}
```

### 7.2 异步签名变更

`applyRagSearchRerankAndSelect` 从同步函数变成了 `async`，所有调用方必须加 `await`。TypeScript 会在编译期报错，不会遗漏。

### 7.3 API Key 为空时的处理

```ts
const rerankAdapter =
  rerankConfig.enabled && rerankConfig.apiKey    // ← 必须双检
    ? createDashScopeRerankAdapter(rerankConfig)
    : undefined
```

如果只设了 `RAG_USE_MODEL_RERANK=true` 但忘记配 `RERANK_API_KEY`，系统会自动回退到手写规则，记录 warning 日志。

---

## 八、总结

| 升级项 | 改前 | 改后 |
|--------|------|------|
| **重排方式** | sectionBoost + keywordBoost（手调参数） | qwen3-rerank Cross-Encoder |
| **配置复杂度** | 7 阈值 + 20+ sectionBoost | 2 环境变量 |
| **灰度控制** | 无 | `RAG_USE_MODEL_RERANK` 开关 |
| **回退能力** | 无 | API 失败 / 未配置 → 自动走手写规则 |
| **新增代码** | - | 6 文件 +229/-6 行 |
| **新增依赖** | - | 0 个 npm 包（纯 HTTP API） |
| **ECS 部署** | - | 不需要额外部署 |

**核心收获**：

> 手写 Rerank 在小规模下有存在价值（快速验证、零外部依赖），但 Cross-Encoder 在精度、可维护性和中文理解上全面超越。用灰度开关做平滑迁移，允许两种模式并行运行，是生产系统升级的最佳实践。

---

## 代码文件索引

| 文件 | 做什么 |
|------|--------|
| `rag/rerank/rerank.adapter.ts` | DashScope qwen3-rerank API 封装 |
| `rag/rerank/rerank.config.ts` | 环境变量 → RerankModelConfig 解析 |
| `rag/rag-search-rerank.ts` | `applyRagSearchRerankAndSelect` 新增 `rerankAdapter` 参数 |
| `rag/rag-search-routing.ts` | `RagSearchRoutingConfig` 新增 `useModelRerank` |
| `rag/rag.service.ts` | RAG ask() 灰度集成 |
| `.env.example` | 环境变量文档 |

---

> *昇哥 · 2026 年 7 月*  
> *90 后 JS 全栈 × AI 学习途中，把踩过的坑写下来*  
> *专注羽毛球，爱音乐，正在研究易经 🎵🏸*

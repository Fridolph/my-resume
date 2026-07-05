---
title: "前端转全栈：从查询扩展崩溃到混合检索跑通 — 一个 RAG 系统的踩坑与修复实录"
published: 2026-06-05
tags: [ElasticSearch, RAG, Rerank, 混合检索, Milvus, query-augment, DeepSeek]
category: 后端
---

> 上两篇搞懂了 ES 的原理和基本操作。这篇记录一个真实过程：搭混合检索 pipeline，query-augment 第一步就崩了，LLM 返回 3 条一模一样的问句。顺着 bug 一路排查，牵出 DeepSeek thinking 模式 + function calling 的兼容坑。修好后，ES + Milvus 双路召回 + Rerank 精排，跑出了第一个完整的 Agentic RAG 链路。

---

## 一、我们要搭什么

一个检索 pipeline：用户问一个问题 → LLM 改写 3 条不同角度的问句 → 每条问句走 ES 关键词检索 + Milvus 语义检索 → 合并去重 → Rerank 重排序 → LLM 基于 Top 3 文档回答。

```
用户 query → query_augment → ES ∥ Milvus → merge → rerank → generate_answer
```

第一关是 `query_augment`——让 LLM 把"家里无线老是断断续续的咋整啊"改写成 3 条不同角度的检索问句。

---

## 二、第一步就崩了：LLM 返回 3 条一模一样的问句

```js
// query-augment.mjs 原始代码
const AUGMENT_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `你是搜索查询优化器。请写出恰好 3 条检索用的问句，与原意一致、角度尽量不同。`],
  ["human", "{query}"],
]);

export async function augmentQuery(chatModel, query) {
  const structured = chatModel.withStructuredOutput(QueryAugmentationSchema);
  const chain = AUGMENT_PROMPT.pipe(structured);
  try {
    const raw = await chain.invoke({ query });
    return { queries: normalizeQueries(query, raw.queries) };
  } catch {
    return { queries: normalizeQueries(query, []) };  // ← 静默吃掉错误
  }
}
```

运行结果：

```
原始: 家里无线老是断断续续的咋整啊
扩展1: 家里无线老是断断续续的咋整啊   ← 一样
扩展2: 家里无线老是断断续续的咋整啊   ← 一样
扩展3: 家里无线老是断断续续的咋整啊   ← 一样
```

**这意味着什么？** ES 用 4 条相同的 query 搜了 4 次，Milvus 也搜了 4 次——**8 次检索全部浪费。**

---

## 三、加一行日志，发现 LLM 根本没返回

`catch` 静默吃了异常，我们看不到任何错误。加上日志：

```js
} catch (e) {
  process.stderr.write("LLM 报错: " + e.message + "\n");
  return { queries: normalizeQueries(query, []) };
}
```

跑出来第一条线索：

```
LLM 报错: Missing value for input variable "queries"
```

LangChain 把 prompt 里的 `{ "queries": [...] }` 当成了模板变量 `{queries}`。修复——花括号转义：

```js
// ❌ 被 LangChain 当变量吃掉
`输出格式：{ "queries": ["问句1", "问句2"] }`

// ✅ 双花括号转义
`输出格式：{{ "queries": ["问句1", "问句2"] }}`
```

---

## 四、模板变量修好了，又报 400

```
LLM 报错: 400 This response_format type is unavailable now
```

`withStructuredOutput` 默认用 `json_schema` 模式——DeepSeek 不支持。改：

```js
// ❌ 默认 json_schema → DeepSeek 400
const structured = chatModel.withStructuredOutput(QueryAugmentationSchema);

// ✅ 指定 functionCalling
const structured = chatModel.withStructuredOutput(QueryAugmentationSchema, {
  method: "functionCalling",
  name: "query_augment",
});
```

---

## 五、functionCalling 加了，又又报 400

```
LLM 报错: 400 Thinking mode does not support this tool_choice
```

DeepSeek thinking 模式会在 JSON 前面插入 `<think>...</think>` 推理过程——function calling 解析器看到非 JSON 内容直接报错。

**不能全局关 thinking——最终回答阶段需要 thinking 来保证质量。**

解决方案：**拆两个 ChatOpenAI 实例。**

```js
// query_augment 专用：关 thinking（需要 function calling）
const augmentModel = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.2,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
  modelKwargs: { thinking: { type: "disabled" } },  // ← 只这里关
});

// generate_answer 专用：保留 thinking（回答质量更高）
const chatModel = new ChatOpenAI({
  model: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  temperature: 0.2,
  configuration: { baseURL: process.env.OPENAI_BASE_URL },
  // 不设 modelKwargs，保留 thinking
});

// compileGraph 里分开传给各自节点
function compileGraph(esClient, milvus, reranker, { chatModel, augmentModel }) {
  return new StateGraph(HybridRetrievalState)
    .addNode("query_augment", async (state) => ({
      queryAugmentation: await augmentQuery(augmentModel, state.query),  // ← 关 thinking
    }))
    .addNode("generate_answer", async (state) => {
      const msg = await ANSWER_PROMPT.pipe(chatModel).invoke({...});    // ← 保留 thinking
    })
}
```

---

## 六、修好后 LLM 还是不听话：返回的还是原句

不报错了，但输出还是 3 条原句。prompt 需要给 LLM 一个具体的示例告诉它"什么叫不同角度"：

```js
const AUGMENT_PROMPT = ChatPromptTemplate.fromMessages([
  ["system", `你是搜索查询优化器。用户给一句问题，你必须生成恰好 3 条**语义不同**的检索问句。

强制规则：
1. 与原句角度完全不同：可以换术语、换问法、换视角
2. 禁止把原句直接复制为其中一条
3. 专有名词必须原样保留
4. 两条不能内容相同或高度相似

示例（这个例子就是你期望的输出格式）：
原句："家里无线老是断断续续的咋整啊"
  [1] "路由器频繁掉线如何排查"
  [2] "WiFi信号不稳定有哪些常见原因"
  [3] "如何排查并解决家庭中的 WIFI 卡顿、掉线问题"

输出格式：{{ "queries": ["问句1", "问句2", "问句3"] }}`],
  ["human", "{query}"],
]);
```

**给 LLM 一个完整的示例，比说十句"角度尽量不同"更管用。**

---

## 七、终于跑通了

```
LLM 原始返回: {"queries":[
  "路由器频繁掉线如何排查",
  "WiFi信号不稳定有哪些常见原因",
  "如何排查并解决家庭中的 WIFI 卡顿、掉线问题"
]}

原始: 家里无线老是断断续续的咋整啊
扩展1: 路由器频繁掉线如何排查          ← 换术语
扩展2: WiFi信号不稳定有哪些常见原因     ← 换问法
扩展3: 如何排查并解决家庭中的 WIFI 卡顿  ← 换视角
```

三条完全不同，覆盖了同一问题的三个角度。

---

## 八、双路检索 + Rerank 的效果

三条问句各自走 ES 和 Milvus，并行检索：

```js
const graph = new StateGraph(HybridRetrievalState)
  .addNode("es_recall", async (state) => {
    const qs = retrievalQueryStrings(state.query, state.queryAugmentation);
    const kEach = Math.max(3, Math.ceil(10 / qs.length));  // ceil(10/3)=4
    const batches = await Promise.all(
      qs.map((q) => esClient.search({
        index: "life_notes",
        query: {
          multi_match: {
            query: q,
            fields: ["note_title^2", "note_body"],  // 标题权重 ×2
            type: "best_fields",
            analyzer: "ik_smart",
          },
        },
      })),
    );
    const flat = batches.flatMap((res) => res.hits.hits.map(docFromEsHit));
    return { esHits: dedupeDocsById(flat) };
  })
  // ES 和 Milvus 并行执行
  .addEdge("query_augment", "es_recall")
  .addEdge("query_augment", "milvus_recall")
  .addEdge(["es_recall", "milvus_recall"], "merge")  // 等两边都完成
  .addEdge("merge", "rerank")
  .addEdge("rerank", "generate_answer")
```

我们来看下最终的执行打印结果：

```md
> node src/rag/hybrid-retrieval-fix.mjs


👤 用户：家里无线老是断断续续的咋整啊
LLM 原始返回: {"queries":["路由器频繁掉线如何排查","WiFi信号不稳定有哪些常见原因","如何排查并解决家庭中的 WIFI 卡顿、掉线问题"]}

--- 查询扩展（LLM 生成 3 条多角度问句）---
原始: 家里无线老是断断续续的咋整啊
  [1] 路由器频繁掉线如何排查
  [2] WiFi信号不稳定有哪些常见原因
  [3] 如何排查并解决家庭中的 WIFI 卡顿、掉线问题

=== 回答 ===

根据生活笔记，可以按以下步骤排查：

1. **重启设备**：先重启光猫，再重启路由器。
2. **调整信道**：将无线信道设为自动或固定为36。
3. **更新固件**：把路由器固件升级到官网最新版。
4. **恢复出厂**：如果还不行，还原出厂设置，并单独测试网线连接。

如果以上方法无效，可能是信号覆盖问题，可尝试靠近路由器或避免死角位置。
```

实际运行结果完美展示了混合检索的价值：

```
用户："无线断断续续"（口语）

ES 关键词检索（2条）：
  ❌ 租房合同划的重点句
  ❌ 净水器滤芯更换记录
  → 笔记里没写"无线""断断续续"，一个都对不上

Milvus 语义检索（4条）：
  ✅ 路由器偶尔断流排查笔记        ← 命中
  ✅ 出差酒店网速玄学              ← 相关

合并去重 → Rerank 筛选 → Top 3 进 LLM

回答：
  1. 先重启光猫，再重启路由器
  2. 调整信道为自动或固定36
  3. 升级固件到官网最新版
  4. 还原出厂设置并单独测试网线
```

**用户说"无线断了"，笔记里是"路由器断流"——ES 对不上，Milvus 懂。两者互补，这就是混合检索的核心价值。**

---

## 九、为什么不要省略 Rerank

合并后 7 条文档 → Rerank 筛到 3 条：

```
保留 ✅  路由器断流排查
保留 ✅  出差酒店网速
保留 ✅  半夜趴窗台透气
过滤 ❌  租房合同
过滤 ❌  净水器滤芯
过滤 ❌  阳台绿植
过滤 ❌  晚饭后遛狗
```

ES 召回的 2 条完全不相关的被 Rerank 全筛掉了。没有 Rerank 的话，这 2 条噪声会混进 LLM 的 context，带偏回答。

---

## 十、踩坑速查

| # | 现象 | 根因 | 修复 |
|---|------|------|------|
| 1 | LLM 返回 3 条相同问句 | `{queries}` 被 LangChain 当模板变量 → catch → fallback | 花括号转义 `{{ }}` |
| 2 | `response_format type unavailable` | json_schema DeepSeek 不支持 | `method: "functionCalling"` |
| 3 | `Thinking mode does not support tool_choice` | thinking 模式下 function calling 报错 | 拆两个 Model 实例 |
| 4 | 修好仍输出原句 | prompt 缺具体示例 | 加完整示例（原句 → 3 条不同问法） |

---

## 十一、完整代码文件

| 文件 | 做什么 |
|------|--------|
| `src/rag/seed-data.mjs` | 同时写 ES 索引和 Milvus 集合（数据灌入） |
| `src/rag/query-augment-fix.mjs` | LLM 改写多角度问句（四步修复版） |
| `src/rag/hybrid-retrieval-fix.mjs` | 双 Model 实例 + ES/Milvus 并行 + Rerank 完整流水线 |
| `src/rerank/dashscope-rerank.mjs` | DashScope Rerank API 封装 |

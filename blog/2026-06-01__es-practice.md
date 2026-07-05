---
title: "前端转全栈：ElasticSearch 实战 — 建索引、CRUD、混合检索一条龙"
published: 2026-06-03
tags: [ElasticSearch, 混合检索, Kibana, CRUD, 前端转全栈, RAG]
category: 后端
---

> 上篇搞懂了倒排索引、IK 分词、BM25 是什么。这篇直接上手——用 Kibana Dev Tools 写 HTTP 请求管 ES，再用 Node.js 代码跑一次 ES + Milvus 混合检索。
>
> 每一步操作，我都会说清楚**它在做什么、背后对应哪个概念**——不是让你背命令，而是让你真正理解在操作什么。

---

## 读这篇，你可以带走什么

| # | 你会学到 | 对应内容 |
|---|---------|---------|
| 1 | 用 Kibana Dev Tools 管理 ES 索引和文档 | 索引 CRUD |
| 2 | 亲手建 Mapping，理解字段类型的区别 | text vs keyword |
| 3 | 用 Node.js 写 ES 的增删改查 | 文档 CRUD |
| 4 | 理解混合检索的完整代码流程 | ES + Milvus |
| 5 | Docker Compose 一键启动 ES + Kibana | 环境搭建 |

---

## 一、环境：一条命令启动 ES + Kibana

```bash
cd examples/es-test
docker compose up -d --build
```

启动后两个端口：
- ES：`http://localhost:9200`
- Kibana：`http://localhost:5601`

打开 Kibana，左边菜单找到 **Dev Tools**（扳手图标），后面的操作都在这里跑。

> **为什么用 Kibana Dev Tools？**
>
> ES 本质上是一个 HTTP 服务，所有操作都是 REST API。Kibana Dev Tools 就是一个专门为 ES 设计的 HTTP 客户端——比 curl 更直观，有语法高亮和自动补全，适合学习阶段快速验证。
>
> 生产环境里你会用 SDK（比如 `@elastic/elasticsearch`），但先在 Dev Tools 里理解每个请求在做什么，再看代码会清晰很多。

---

## 二、用 HTTP 请求管理 ES

### 2.1 查看所有索引

```
GET /_cat/indices?v
```

等价于 MySQL 的 `SHOW TABLES`。

返回结果里有几列值得关注：

| 列名 | 含义 |
|------|------|
| `health` | 索引健康状态（green / yellow / red） |
| `index` | 索引名 |
| `docs.count` | 文档数量 |
| `store.size` | 占用磁盘大小 |

**关于 yellow 状态：** 单节点 ES 里，副本分片没有其他节点可以分配，所以会显示 yellow。这不影响读写，是正常现象。如果强迫症想消掉它：

```
PUT /article/_settings
{
  "index": { "number_of_replicas": 0 }
}
```

把副本数设为 0，yellow 就变 green 了。

---

### 2.2 创建索引（建 Mapping）

这是最关键的一步。**Mapping 就是 ES 的"建表语句"**，它决定了每个字段的类型，以及这个字段用什么分词器。

```
PUT /article
{
  "mappings": {
    "properties": {
      "title":      { "type": "text", "analyzer": "ik_max_word", "search_analyzer": "ik_smart" },
      "content":    { "type": "text", "analyzer": "ik_max_word", "search_analyzer": "ik_smart" },
      "author":     { "type": "keyword" },
      "createTime": { "type": "date" },
      "viewCount":  { "type": "integer" }
    }
  }
}
```

**字段类型的选择是重点，直接影响搜索结果：**

| type | 会被分词吗 | 什么时候用 | 错用的后果 |
|------|----------|-----------|-----------|
| `text` | 会（走 IK 分词） | 标题、正文——需要全文搜索的字段 | 用 keyword 存文章内容，搜索直接失效 |
| `keyword` | 不会，精确匹配 | 作者名、标签、状态枚举 | 用 text 存 ID，精确查询会被分词破坏 |
| `integer` | 不会 | 数字字段 | — |
| `date` | 不会 | 日期字段 | — |

**关于 `analyzer` 和 `search_analyzer` 的区别：**

```
"analyzer": "ik_max_word"     ← 写入时用，最细粒度分词，追求高召回
"search_analyzer": "ik_smart" ← 搜索时用，最粗粒度分词，追求高精确
```

这对应了上篇说的核心原则：**写入时 ik_max_word 穷举所有词条，搜索时 ik_smart 按语义单元精准匹配。** 两者配合，才能在召回率和精确率之间取得平衡。

你可以在 Dev Tools 里直接验证分词效果：

```
# 验证写入时的分词
POST /_analyze
{
  "analyzer": "ik_max_word",
  "text": "RAG混合检索实战"
}

# 验证搜索时的分词
POST /_analyze
{
  "analyzer": "ik_smart",
  "text": "RAG混合检索实战"
}
```

对比两个结果，你会直观看到 ik_max_word 拆出了更多词条，ik_smart 只保留了语义完整的词语。

---

### 2.3 写入文档

```
POST /article/_doc
{
  "title": "RAG混合检索实战",
  "content": "ES负责关键词检索，Milvus负责向量语义检索，结合使用效果更佳",
  "author": "AI开发",
  "createTime": "2026-04-26",
  "viewCount": 256
}
```

**这里有一个坑：** `POST /article/_doc` 没有指定 `_id`，ES 会自动生成一个随机 ID。

如果你反复执行这条请求，每次都会生成一条新文档，ID 不同——数据就重复了。

**避免重复的方式：指定 ID 写入**

```
PUT /article/_doc/my-doc-1
{
  "title": "RAG混合检索实战",
  ...
}
```

这样 ID 固定为 `my-doc-1`，再写同名文档就会覆盖，不会重复。

> **背后的原理：** ES 的写入流程是这样的：
>
> 1. 文档写入内存缓冲区（buffer）
> 2. 每秒刷新（refresh）到内存段（segment），此时可搜索
> 3. 定期 flush 到磁盘，持久化
>
> 这就是为什么 ES 是**近实时**而不是实时——写入后大约 1 秒才能被搜索到。

---

### 2.4 搜索文档

```
GET /article/_search
{
  "query": {
    "match": { "title": "全文检索" }
  },
  "size": 10
}
```

`match` 查询会对搜索词分词后匹配。搜"全文检索"，ES 用 ik_smart 把它拆成 `全文检索`（或 `全文` + `检索`），然后去倒排索引表里查。

**几种常用查询类型：**

| 查询类型 | 用法 | 适合场景 |
|---------|------|---------|
| `match` | 分词后模糊匹配 | 全文搜索，搜标题、正文 |
| `term` | 精确匹配，不分词 | 搜 keyword 字段，如作者名、标签 |
| `bool` | 组合多个条件 | 复杂查询，AND / OR / NOT |
| `range` | 范围查询 | 日期范围、数字范围 |

**`match` 和 `term` 的区别很重要：**

```
# match 查询：会分词，适合 text 字段
GET /article/_search
{
  "query": { "match": { "title": "全文检索" } }
}

# term 查询：不分词，适合 keyword 字段
GET /article/_search
{
  "query": { "term": { "author": "AI开发" } }
}
```

如果你用 `term` 查询一个 `text` 字段，可能搜不到——因为 `text` 字段存的是分词后的词条，而不是原始字符串。

**`bool` 组合查询：**

```
GET /article/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "title": "检索" } }
      ],
      "filter": [
        { "term": { "author": "AI开发" } },
        { "range": { "viewCount": { "gte": 100 } } }
      ]
    }
  }
}
```

`must` 参与打分，`filter` 只过滤不打分（性能更好）。这是生产环境里最常用的查询结构。

---

### 2.5 更新文档

```
POST /article/_update/my-doc-1
{
  "doc": {
    "viewCount": 300
  }
}
```

只更新指定字段，其他字段保持不变。

> **注意：** ES 的更新不是真正的原地修改。底层是标记旧文档为删除，写入一个新文档。这就是为什么频繁更新会导致索引膨胀，需要定期执行 `forcemerge` 清理。

---

### 2.6 删除文档

**按 ID 删除单条：**

```
DELETE /article/_doc/my-doc-1
```

**按条件批量删除：**

```
POST /article/_delete_by_query
{
  "query": {
    "match": { "title": "RAG混合检索实战" }
  }
}
```

等价于 SQL 的 `DELETE FROM article WHERE title LIKE '%RAG混合检索实战%'`。

**删整个索引（慎用）：**

```
DELETE /article
```

---

### 2.7 查看索引的 Mapping

```
GET /article/_mapping
```

用来确认索引的字段类型配置是否符合预期。建完索引后养成习惯查一下，避免字段类型配错了还不知道。

---

## 三、用 Node.js 代码操作 ES

Kibana Dev Tools 适合学习和调试，生产环境里用 SDK。

安装官方客户端：

```bash
npm install @elastic/elasticsearch
```

### 3.1 初始化客户端

```js
import { Client } from '@elastic/elasticsearch';

const client = new Client({ node: 'http://localhost:9200' });

// 验证连接
const info = await client.info();
console.log('ES 版本:', info.version.number);
```

### 3.2 创建索引（create.mjs）

```js
// 先检查索引是否存在，避免重复创建报错
const exists = await client.indices.exists({ index: 'travel_journal' });
if (exists) {
  console.log('索引已存在，跳过创建');
} else {
  await client.indices.create({
    index: 'travel_journal',
    mappings: {
      properties: {
        note_title: {
          type: 'text',
          analyzer: 'ik_max_word',       // 写入时：最细粒度分词
          search_analyzer: 'ik_smart'    // 搜索时：最粗粒度分词
        },
        note_body: {
          type: 'text',
          analyzer: 'ik_max_word',
          search_analyzer: 'ik_smart'
        },
        tags:       { type: 'keyword' },  // 标签：精确匹配，不分词
        mood:       { type: 'keyword' },  // 心情：精确匹配，不分词
        priority:   { type: 'integer' },
        created_at: { type: 'date' }
      }
    }
  });
  console.log('索引创建成功');
}
```

### 3.3 文档 CRUD（operate.mjs）

```js
// ===== 新增（指定 ID，避免重复）=====
await client.index({
  index: 'travel_journal',
  id: 'note-001',           // 指定 ID，重复写入会覆盖
  document: {
    note_title: '杭州西湖半日游',
    note_body: '早上绕湖慢跑，中午吃片儿川，下午在断桥拍照放松。',
    tags: ['旅行', '周末', '杭州'],
    mood: 'relaxed',
    priority: 2,
    created_at: new Date().toISOString()
  }
});

// ===== 查询单条（按 ID）=====
const doc = await client.get({
  index: 'travel_journal',
  id: 'note-001'
});
console.log(doc._source);  // 原始文档内容在 _source 里

// ===== 全文搜索 =====
const results = await client.search({
  index: 'travel_journal',
  query: {
    match: { note_body: '西湖跑步' }  // ik_smart 分词后匹配
  },
  size: 5
});

// 结果在 hits.hits 里，每条有 _score（BM25 打分）
results.hits.hits.forEach(hit => {
  console.log(`分数: ${hit._score}, 标题: ${hit._source.note_title}`);
});

// ===== 更新（局部更新）=====
await client.update({
  index: 'travel_journal',
  id: 'note-001',
  doc: { priority: 3 }  // 只更新 priority 字段
});

// ===== 删除（按 ID）=====
await client.delete({
  index: 'travel_journal',
  id: 'note-001'
});
```

**关于搜索结果的 `_score`：** 这就是 BM25 打分的结果。分数越高，代表这条文档和搜索词越相关。ES 默认按 `_score` 降序排列，所以第一条永远是最相关的。

---

## 四、混合检索：ES + Milvus 一起跑

这是这篇的重头戏。把上篇讲的理论，用代码跑一遍。

### 4.1 为什么要混合检索

先回顾一下上篇的结论：

| | ES（词条检索） | Milvus（语义检索） |
|--|--------------|-------------------|
| **优势** | 精确匹配关键词、术语、编号 | 捕捉语义相似性，同义词、近义词 |
| **劣势** | 搜「西湖游玩」未必命中「杭州旅游」 | 搜 `errorCode=5001` 可能漂到 `5002` |

两者互补，混合检索的召回质量显著高于单路检索。

### 4.2 完整流程

```
用户输入："推荐一些杭州周末活动"
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Step 1: Query 重写（可选，但推荐）                   │
│  用 LLM 把用户问题改写成多个角度的查询词               │
│  原始: "推荐一些杭州周末活动"                          │
│  重写: ["杭州周末", "杭州旅游景点", "西湖周边活动"]     │
└─────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────┐    ┌──────────────────────────┐
│  Step 2a: ES 词条检索  │    │  Step 2b: Milvus 语义检索  │
│                       │    │                           │
│  ik_smart 分词查询     │    │  Embedding 模型生成向量    │
│  倒排索引查找           │    │  余弦相似度计算            │
│  BM25 打分排序         │    │  ANN 近似最近邻搜索        │
│  召回 Top 20           │    │  召回 Top 20              │
└──────────────────────┘    └──────────────────────────┘
         │                            │
         └────────────┬───────────────┘
                      ▼
         ┌─────────────────────────┐
         │  Step 3: 合并去重        │
         │  同 ID 保留更高分数       │
         │  合并后约 30-40 条候选    │
         └─────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │  Step 4: Rerank 精排    │
         │  Cross-Encoder 重新打分  │
         │  选出最相关的 Top 5      │
         └─────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────┐
         │  Step 5: 拼 Prompt      │
         │  Top 5 文档 + 用户问题   │
         │  → LLM 生成回答          │
         └─────────────────────────┘
```

### 4.3 关键代码（hybrid-retrieval.mjs）

**Step 1: Query 重写**

```js
async function rewriteQuery(originalQuery) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: `将以下问题改写成 3 个不同角度的搜索词，用于检索知识库。
只返回 JSON 数组，不要其他内容。
问题：${originalQuery}
格式：["搜索词1", "搜索词2", "搜索词3"]`
    }]
  });

  return JSON.parse(response.choices[0].message.content);
}
```

**为什么要 Query 重写？** 用户的原始问题往往口语化，词条检索可能命中率低。重写成多个角度的查询词，能显著提升召回率。

**Step 2a: ES 词条检索**

```js
async function searchES(queries) {
  const allHits = [];

  for (const query of queries) {
    const result = await esClient.search({
      index: 'life_notes',
      query: {
        bool: {
          should: [
            { match: { note_title: { query, boost: 2 } } },  // 标题权重更高
            { match: { note_body: query } }
          ]
        }
      },
      size: 10
    });

    // 把 ES 结果格式化成统一结构
    result.hits.hits.forEach(hit => {
      allHits.push({
        id: hit._id,
        content: hit._source.note_body,
        title: hit._source.note_title,
        score: hit._score,
        source: 'es'
      });
    });
  }

  return allHits;
}
```

注意 `boost: 2`——标题字段的权重设为 2 倍，因为标题命中通常比正文命中更相关。这是 BM25 打分之外的人工干预，可以根据业务场景调整。

**Step 2b: Milvus 语义检索**

```js
async function searchMilvus(queries) {
  const allHits = [];

  for (const query of queries) {
    // similaritySearchWithScore 返回 [Document, score] 数组
    const results = await vectorStore.similaritySearchWithScore(query, 10);

    results.forEach(([doc, score]) => {
      allHits.push({
        id: doc.metadata.id,
        content: doc.pageContent,
        title: doc.metadata.title,
        score: score,           // 余弦相似度，越高越相关
        source: 'milvus'
      });
    });
  }

  return allHits;
}
```

**Step 3: 合并去重**

```js
function mergeAndDeduplicate(esHits, milvusHits) {
  const map = new Map();

  // 先放 ES 结果
  for (const doc of esHits) {
    map.set(doc.id, doc);
  }

  // 再放 Milvus 结果，同 ID 保留更高分数
  for (const doc of milvusHits) {
    const existing = map.get(doc.id);
    if (!existing || doc.score > existing.score) {
      map.set(doc.id, doc);
    }
  }

  // 按分数降序排列
  return Array.from(map.values())
    .sort((a, b) => b.score - a.score);
}
```

**Step 4: Rerank 精排**

```js
async function rerank(query, candidates) {
  // 用 LLM 对每个候选文档打相关性分数
  const scored = await Promise.all(
    candidates.slice(0, 20).map(async (doc) => {  // 只对前 20 条精排
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `判断以下文档与问题的相关性，返回 0-10 的整数分数，只返回数字。
问题：${query}
文档：${doc.content}
分数：`
        }]
      });

      return {
        ...doc,
        rerankScore: parseInt(response.choices[0].message.content.trim())
      };
    })
  );

  // 按 Rerank 分数降序，取 Top 5
  return scored
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, 5);
}
```

> **为什么 Rerank 比 BM25 和余弦相似度更准确？**
>
> BM25 和向量检索都是**双塔模型**——查询和文档分别编码，再比较。它们在初始召回阶段速度快，但精度有限。
>
> Rerank（Cross-Encoder）是**交叉编码**——把查询和文档拼在一起，让模型同时看到两者的完整内容，打出更精准的相关性分数。
>
> 代价是速度慢（每对都要推理一次），所以只用在最后的精排阶段，对少量候选文档做精排，不用在初始召回阶段。

**Step 5: 拼 Prompt，LLM 作答**

```js
async function generateAnswer(query, topDocs) {
  const context = topDocs
    .map((doc, i) => `[${i + 1}] ${doc.title}\n${doc.content}`)
    .join('\n\n');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `你是一个知识助手。请基于以下检索到的资料回答用户问题。
如果资料中没有相关信息，请直接说"我没有找到相关信息"，不要编造。

参考资料：
${context}`
      },
      {
        role: 'user',
        content: query
      }
    ]
  });

  return response.choices[0].message.content;
}
```

**System Prompt 里的"不要编造"很重要。** 这是 RAG 的核心价值之一——让 LLM 基于真实检索结果回答，而不是凭记忆生成。没有这个约束，LLM 在检索结果不够好时仍然会幻觉。

### 4.4 完整调用

```js
async function hybridRetrieval(userQuery) {
  console.log(`\n用户问题: ${userQuery}`);

  // Step 1: Query 重写
  const queries = await rewriteQuery(userQuery);
  console.log('重写后的查询词:', queries);

  // Step 2: 并行双路检索
  const [esHits, milvusHits] = await Promise.all([
    searchES(queries),
    searchMilvus(queries)
  ]);
  console.log(`ES 召回: ${esHits.length} 条, Milvus 召回: ${milvusHits.length} 条`);

  // Step 3: 合并去重
  const merged = mergeAndDeduplicate(esHits, milvusHits);
  console.log(`合并去重后: ${merged.length} 条`);

  // Step 4: Rerank 精排
  const topDocs = await rerank(userQuery, merged);
  console.log(`Rerank 后 Top ${topDocs.length} 条`);

  // Step 5: LLM 作答
  const answer = await generateAnswer(userQuery, topDocs);
  console.log('\n最终回答:\n', answer);

  return answer;
}

// 跑起来
await hybridRetrieval('推荐一些杭州周末活动');
```

---

## 五、踩坑记录

### 坑 1：Docker 网络——Attu 连不上 Milvus

Milvus 和 Attu 都跑在 Docker 容器内时，连接地址不能写 `localhost:19530`。

**原因：** 容器里的 `localhost` 指的是容器自己，不是宿主机。

```
# ❌ 错误
地址: localhost:19530

# ✅ 正确
地址: milvus-standalone:19530  ← 用 Milvus 容器的 container_name
```

Docker 同网络下自动做 DNS，容器名就是域名。这是 Docker 网络的基础知识，不只是 Milvus 的问题，所有容器间通信都适用。

### 坑 2：重复数据

每次 `POST /article/_doc` 没指定 ID 都会新增一条，反复执行就会有大量重复文档。

**解决方式：**
- 写入时用 `PUT /article/_doc/<id>` 指定固定 ID
- 已经重复了，用 `_delete_by_query` 批量清理

```
POST /article/_delete_by_query
{
  "query": { "match": { "title": "RAG混合检索实战" } }
}
```

### 坑 3：Mapping 建错了改不了

ES 的 Mapping 一旦建好，**已有字段的类型不能修改**。比如你把 `author` 建成了 `text`，想改成 `keyword`，只能：

1. 删掉整个索引 `DELETE /article`
2. 重新建索引，配置正确的 Mapping
3. 重新导入数据

所以建索引前，**一定要先想清楚每个字段的类型**。

### 坑 4：搜索不到刚写入的文档

ES 是近实时的，写入后大约 1 秒才能被搜索到（refresh interval 默认 1s）。

如果你写入后立刻搜索，可能搜不到。等 1 秒再试，或者手动触发 refresh：

```
POST /article/_refresh
```

开发阶段调试时常见，生产环境一般不需要手动 refresh。

### 坑 5：`term` 查询 `text` 字段搜不到

```
# ❌ 这样搜不到
GET /article/_search
{
  "query": { "term": { "title": "RAG混合检索" } }
}
```

**原因：** `title` 是 `text` 类型，写入时被 IK 分词成了多个词条。`term` 查询不分词，直接拿"RAG混合检索"这个字符串去倒排索引里找，找不到。

```
# ✅ 正确做法：text 字段用 match 查询
GET /article/_search
{
  "query": { "match": { "title": "RAG混合检索" } }
}
```

**记住这个原则：`text` 字段用 `match`，`keyword` 字段用 `term`。**

---

## 六、文件索引

| 文件 | 做什么 |
|------|--------|
| `examples/es-test/src/create.mjs` | 创建索引 + 灌测试数据 |
| `examples/es-test/src/operate.mjs` | 文档 CRUD 示例 |
| `examples/es-test/src/rag/hybrid-retrieval.mjs` | ES + Milvus 混合检索完整流程 |
| `examples/es-test/docker-compose.yml` | ES + Kibana 一键启动 |
| `examples/es-test/elasticsearch/Dockerfile` | 带 IK 分词器的 ES 镜像 |

---

## 七、小结

这篇把上篇的概念都落地了一遍：

| 概念 | 实践对应 |
|------|---------|
| **倒排索引** | `GET /article/_search` 毫秒级返回，背后就是倒排索引在工作 |
| **IK 分词** | Mapping 里 `analyzer: ik_max_word` + `search_analyzer: ik_smart` |
| **BM25 打分** | 搜索结果里的 `_score` 字段，ES 默认打分算法 |
| **词条 vs 语义** | ES `match` 查询 vs Milvus `similaritySearchWithScore` |
| **混合检索** | 双路并行召回 → 合并去重 → Rerank → Top K → LLM |

**一句话总结混合检索的价值：**

> ES 保证精确实体不漂移，Milvus 保证语义相近能召回，Rerank 保证最终排序最准确，LLM 基于真实资料作答不幻觉。四者缺一，RAG 的可靠性都会打折扣。

---

## 下一篇

两篇 ES 讲完了，下一步是把这套混合检索接入真实的 NestJS 后端服务——封装成 Service，接入 API，处理并发和错误，让它真正跑在生产环境里。

---

> *昇哥 · 2026年6月*
> *90后 JS 全栈 × AI 学习途中，把踩过的坑写下来*
> *专注羽毛球，爱音乐，正在研究易经 🎵🏸*

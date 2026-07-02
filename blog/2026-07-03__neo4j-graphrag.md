---
title: "前端转全栈：Neo4j 知识图谱 — 从 Cypher 到 GraphRAG，一次搞懂图数据库"
published: 2026-07-03
tags: [Neo4j, 图数据库, Cypher, GraphRAG, 知识图谱]
category: 后端
---

> Milvus 找"意思相近"的文档，ES 找"包含这个词"的文档。它们都是独立文档——文档之间没有关系。Neo4j 存的是"东西和东西之间的连接"，可以沿着关系链路跳转查找，多长的推理链都能跑。这篇从零讲 Neo4j 的概念、Cypher 语句、GraphRAG 实践。

---

## 一、你熟悉的 ES 和 Milvus，存的是"孤立的文档"

ES 的索引、Milvus 的 collection，本质都是一条条独立的记录：

```
文档1：{ title: "路由器偶尔断流排查笔记", body: "..." }
文档2：{ title: "净水器滤芯更换记录", body: "..." }
文档3：{ title: "梧州龟苓膏粉冲泡比例", body: "..." }

它们之间：没有任何连接，互相不知道对方的存在。
```

但现实世界里，事物是有关系的：

```
路由器笔记 → 涉及设备 → 路由器 → 需要 → 光猫 → 属于供应商 → 中国电信
净水器笔记 → 涉及设备 → 净水器 → 需要 → 滤芯 → 上次购买 → 2025年4月
路由器 + 净水器 → 同属于 → 家庭设备 → 维护频率 → 3个月
```

**Neo4j 不是用来存"孤立的文档"，而是存这种"节点 + 关系"的网络结构。**

---

## 二、Neo4j 的核心概念

Neo4j 把数据建模成两个东西：

### 2.1 节点（Node）

```cypher
CREATE (p:Product {name: "珍珠奶茶", calorie: "中高"})
```

- `( )` 表示一个节点
- `p` 是变量名（后续引用用）
- `:Product` 是标签（相当于 MySQL 的表名）
- `{ }` 里是属性（相当于字段）

### 2.2 关系（Relationship）

```cypher
MATCH (p:Product {name: "珍珠奶茶"}), (i:Ingredient {name: "珍珠"})
CREATE (p)-[:包含]->(i)
```

- `-[:包含]->` 是一条有方向、有名字的连线
- 方向很重要：`(A)-[:属于]->(B)` 和 `(A)<-[:属于]-(B)` 是两条不同的关系

### 2.3 属性（Property）

节点和关系都可以带属性：

```cypher
// 节点属性
CREATE (p:Product {name: "珍珠奶茶", price: 15, calorie: "中高"})

// 关系也可以带属性
CREATE (p)-[:包含 {quantity: "适量", optional: false}]->(i)
```

### 2.4 标签（Label）

标签就是节点的"类型"，一个节点可以有多个标签：

```cypher
CREATE (p:Product:Beverage:HotItem {name: "珍珠奶茶"})
```

---

## 三、MySQL 处理"多层关系"的天然瓶颈

查询"和路由器相关的所有设备，以及这些设备的维保记录"：

```sql
-- MySQL：每多一层关系，加一个 JOIN
SELECT devices.name, maintenance.record
FROM notes
JOIN note_device ON notes.id = note_device.note_id      -- 第1层
JOIN devices ON note_device.device_id = devices.id      -- 第2层
JOIN device_maintenance ON devices.id = ...             -- 第3层
JOIN maintenance ON device_maintenance.maintenance_id = ... -- 第4层
WHERE notes.id = 'life_04';
```

4 个 JOIN——数据量一大，查询时间指数级增长。5~6 层关系基本不可用。

**Neo4j 的等价查询：**

```cypher
MATCH (n:Note {id: "life_04"})-[*1..3]-(related)
RETURN related
```

`[*1..3]` = 跳 1 到 3 步，自动找到所有关联节点。不需要 JOIN，不需要写死路径，**遍历深度不影响查询性能**。

---

## 四、Cypher 基础操作

### 4.1 创建节点和关系

```cypher
CREATE (p:Product {name: "珍珠奶茶"})
CREATE (t:Type {name: "台式奶茶"})
CREATE (i:Ingredient {name: "珍珠"})
CREATE (m:Method {name: "煮制"})

// 创建关系
MATCH (p:Product {name: "珍珠奶茶"}), (t:Type {name: "台式奶茶"})
CREATE (p)-[:属于]->(t)

MATCH (p:Product {name: "珍珠奶茶"}), (i:Ingredient {name: "珍珠"})
CREATE (p)-[:包含]->(i)

MATCH (i:Ingredient {name: "珍珠"}), (m:Method {name: "煮制"})
CREATE (i)-[:使用]->(m)
```

一条 `MATCH` 找到节点，一条 `CREATE` 建立连接。

### 4.2 查询

单跳查询：

```cypher
MATCH (p:Product {name: "珍珠奶茶"})-[:包含]->(i:Ingredient)
RETURN i.name
```

多跳查询（GraphRAG 的灵魂）：

```cypher
// 珍珠奶茶 → 配料 → 制作工艺
MATCH (p:Product {name: "珍珠奶茶"})-[:包含]->(i)-[:使用]->(m)
RETURN p.name, i.name, m.name
```

一条 Cypher 串起三层关系。这就是"多跳推理"。

### 4.3 更新和删除

```cypher
// 更新属性
MATCH (p:Product {name: "珍珠奶茶"})
SET p.price = 15, p.calorie = "中高"

// 删除关系
MATCH (p:Product {name: "珍珠奶茶"})-[r:包含]->(i:Ingredient {name: "珍珠"})
DELETE r

// 删除节点 + 连带所有关系
MATCH (i:Ingredient {name: "芋圆"})-[r]-()
DELETE r, i
```

### 4.4 用 Node.js 代码操作

```js
import neo4j from 'neo4j-driver';

const driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', '12345678'));
const session = driver.session();

// 创建关系
await session.run(`
  MATCH (p:Product {name: "珍珠奶茶"}), (i:Ingredient {name: "珍珠"})
  CREATE (p)-[:包含]->(i)
`);

// 查询
const result = await session.run(`
  MATCH (p:Product {name: "珍珠奶茶"})-[:包含]->(i)
  RETURN i.name
`);

result.records.forEach(r => console.log(r.get('i.name')));
// 珍珠、果糖、红茶、牛奶
```

---

## 五、GraphRAG：知识图谱 + RAG

### 5.1 普通 RAG 的问题

用户问"我家所有需要定期维护的设备有哪些"：

```txt
普通 RAG：
  搜"维护" → 只找到"净水器滤芯记录"
  搜"设备" → 找到一堆不相关的
  → 它不知道路由器、净水器、绿植都是"家里的设备"
```

### 5.2 GraphRAG 的解法

```
第一步：LLM 生成 Cypher
  用户问 → LLM 根据图谱 Schema 生成查询语句：
  MATCH (f:家庭设备) ← [:同属于] - (d) - [:有记录] → (n:Note)
  RETURN d.name, n.title

第二步：Neo4j 执行
  返回：路由器 → 断流排查笔记
        净水器 → 滤芯更换记录
        绿植 → 浇水频率笔记

第三步：LLM 组织回答
  基于关联结果生成完整回答
```

### 5.3 LangGraph 实现

```js
const workflow = new StateGraph({ channels: state })
  .addNode('generateCypher', async (state) => {
    const prompt = `你是 Neo4j Cypher 生成器。关系方向：
    - (Product)-[:包含]->(Ingredient)
    - (Ingredient)-[:使用]->(Method)
    用户问题：${state.query}
    只返回 Cypher。`;
    const res = await llm.invoke([new HumanMessage(prompt)]);
    return { cypher: res.content };
  })
  .addNode('executeGraph', async (state) => {
    const res = await graph.query(state.cypher);
    return { context: JSON.stringify(res) };
  })
  .addNode('generateAnswer', async (state) => {
    const res = await llm.invoke([new HumanMessage(
      `基于检索结果回答：${state.context}\n用户问题：${state.query}`
    )]);
    return { answer: res.content };
  })
  .addEdge(START, 'generateCypher')
  .addEdge('generateCypher', 'executeGraph')
  .addEdge('executeGraph', 'generateAnswer')
  .addEdge('generateAnswer', END)
```

---

## 六、Milvus / ES / Neo4j 各管什么

| | 检索原理 | 擅长 | 经典场景 |
|----|---------|------|---------|
| **Milvus** | 向量相似度 | 模糊语义、自然语言 | "推荐适合春天的奶茶" |
| **ES** | 倒排索引 + BM25 | 精确词条、专业术语 | "订单号 PO-20250409 的配件" |
| **Neo4j** | 图谱关系 + Cypher | 实体关联、多跳推理 | "珍珠奶茶有哪些配料？珍珠用什么工艺？" |

**一句话区分：**

```
Milvus → 找"意思相近"的内容
ES     → 找"包含这个词"的文档
Neo4j  → 找"和它有关系"的所有东西
```

三者不是替代关系，是互补关系。生产级 RAG 的标准方案就是**三者同时使用**——向量检索兜底模糊语义，关键词检索兜底精确匹配，知识图谱兜底关系推理。

---

## 七、Docker 安装

```bash
cd examples/neo4j-graphrag
docker compose up -d
```

启动后 `http://localhost:7474` 打开 Neo4j Browser，用户名 `neo4j` / 密码 `12345678`，可以直接跑 Cypher 语句。

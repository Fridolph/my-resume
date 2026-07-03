# Neo4j 知识图谱学习笔记 — 从表格思维到图思维

> my-resume 项目 GraphRAG 学习总结  
> 2026 年 7 月

---

## 一、核心思维转变：从"表格"到"图"

| 表格思维 | 图思维 |
|---|---|
| 数据存在行列里 | 数据存在节点和关系里 |
| 关联靠 JOIN | 关联靠 MATCH 路径 |
| 问"这张表有什么字段" | 问"这个世界里有哪些实体和连接" |
| 适合结构化统计 | 适合语义查询和推理 |

---

## 二、关系设计原则：把简历读成一段话

设计关系的本质依据是**自然语言表达**：

```
付寅生  毕业于  四川大学锦江学院
付寅生  有经历  [在网思科平的那段时光]
[那段经历]  任职于  网思科平
付寅生  参与  EDR项目
EDR项目  使用了  Vue3
付寅生  擅长  前端核心能力
前端核心能力  包含  Vue3
付寅生  具备  AI工程化实践的亮点
付寅生  兴趣爱好  羽毛球
```

**每一条关系，都是一句自然语言。** 这是检验关系设计好不好的唯一标准。

---

## 三、关系粒度区分：`使用` vs `使用了`

```
Company    -[使用]->   Technology   # 公司层面：这家公司用这个技术
Experience -[使用了]->  Technology  # 经历层面：我在这段经历中用了这个技术
```

| 查询场景 | 走哪条关系 |
|---|---|
| "你在哪些公司用过 Vue？" | Company → 使用 → Technology |
| "你第一次用 TypeScript 是什么时候？" | Experience → 使用了（带 firstUsed 属性） |

---

## 四、Seed 脚本的核心思路

```
原始数据 (JSON)
    ↓
① 实体提取      → 找出所有"名词"，准备建节点
    ↓
② 数据清洗      → "Nuxt 4" → "Nuxt"，去噪，去重
    ↓
③ MERGE 建节点  → 幂等写入，跑多次不会重复
    ↓
④ MERGE 建关系  → 先有节点，再连线
    ↓
⑤ 统计验证      → 数量对不对？关系有没有断？
```

**MERGE 是关键**，语义：`"存在就用，不存在就建"`，脚本可反复执行。

---

## 五、通用 AI Agent 开发框架

```
┌─────────────────────────────────────────┐
│           拿到任何新数据集时              │
├─────────────────────────────────────────┤
│  1. 问：这里有哪些"实体"？（名词）        │
│  2. 问：实体之间有哪些"关系"？（动词）    │
│  3. 问：我将来会问什么"问题"？（查询场景）│
│  4. 反推：查询场景能否被图模型支撑？      │
│  5. 迭代：跑脚本 → 验证 → 发现问题 → 改  │
└─────────────────────────────────────────┘
```

**第 3 步最容易被忽略，但最重要。** 你的图谱是为了回答问题而存在的——先想好问题，再设计模型。

---

## 六、当前图谱可回答的问题

```cypher
-- 我用过哪些技术？
MATCH (p:MR_Person)-[:掌握]->(t:MR_Technology) RETURN t.name

-- 我在哪个项目用了 Neo4j？
MATCH (proj:MR_Project)-[:使用]->(t:MR_Technology {name: 'Neo4j'})
RETURN proj.name

-- 我的前端能力包含哪些技术？
MATCH (s:MR_Skill {name:'前端核心能力'})<-[:属于]-(t:MR_Technology)
RETURN t.name

-- 我的完整职业路径？
MATCH (p:MR_Person)-[:有经历]->(e:MR_Experience)-[:任职于]->(c:MR_Company)
RETURN e.role, c.name, e.startDate, e.endDate
```

---

## 七、完整节点+关系表

**9 类节点**：Person, Company, Industry, Experience, Project, Technology, Skill, School, Interest, Highlight

**11 条关系**：

| 关系 | 语义 |
|---|---|
| `Person -[:毕业于]-> School` | 教育背景 |
| `Person -[:有经历]-> Experience` | 工作经历 |
| `Experience -[:任职于]-> Company` | 公司关联 |
| `Company -[:属于]-> Industry` | 行业分类 |
| `Experience -[:使用了]-> Technology` | 经历中用过的技术 |
| `Person -[:参与]-> Project` | 项目参与 |
| `Project -[:使用]-> Technology` | 项目技术栈 |
| `Person -[:擅长]-> Skill` | 技能分类 |
| `Technology -[:属于]-> Skill` | 技术归类 |
| `Person -[:具备]-> Highlight` | 个人亮点 |
| `Person -[:兴趣爱好]-> Interest` | 兴趣爱好 |

---

> **一句话总结：**
> **"先问问题，再建模型，用动词连名词，用 MERGE 写数据，用 MATCH 验答案。"**

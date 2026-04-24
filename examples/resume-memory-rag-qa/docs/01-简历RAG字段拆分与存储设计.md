# 第 01 章：简历 RAG 的字段拆分与存储设计

## 目标

- 不是把整份简历粗暴切窗后直接入库
- 而是先按“语义字段块”拆分，再对长内容做二次 chunk
- 这样更适合后续在 `my-resume` 中做精准问答与结构化展示

## 设计思路

### 1) 先按业务结构拆

简历天然有强结构：

- 基本信息
- 核心竞争力
- 教育经历
- 专业技能
- 工作经历
- 核心项目经历

这些不应该一上来就按固定字符切，而应该先按 section / subsection / item 拆成语义记录。

### 2) 再对长字段做 chunk

例如：

- 工作概述
- 项目概览
- 亮点与解决方案

这些可能过长，再用 `RecursiveCharacterTextSplitter` 做第二层切块。

## 推荐存储字段

- `source_id`：来自哪份简历
- `locale`：语言
- `section`：一级分类，如 `skills`
- `subsection`：二级分类，如 `ai-agent`
- `entity_type`：块类型，如 `skill_item` / `project_summary`
- `title`：标题
- `content`：正文
- `tags`：检索辅助标签
- `chunk_index` / `chunk_count`：切块位置
- `vector`：向量

## 为什么这比整篇切块更好

- 问“AI Agent 有哪些经验”时，更容易命中 `AI Agent 开发`、相关项目亮点
- 问“某家公司做过什么”时，更容易命中对应工作经历块
- 问“有没有管理经验”时，更容易命中核心竞争力和一蟹科技经历

## 当前 demo

示例目录：

- `examples/resume-memory-rag-qa/src/resume-parser.mjs`
- `examples/resume-memory-rag-qa/src/ingest-resume.mjs`
- `examples/resume-memory-rag-qa/src/ask-resume.mjs`

## 对 `my-resume` 的启发

当前 `my-resume` 里 `resume_core` 还是“整份 markdown 一块入检索”。  
后续可以逐步升级为：

1. `resume_core_document` 保留全文版本
2. `resume_semantic_chunks` 新增语义字段块版本
3. 检索时混合召回：全文块兜底 + 字段块优先

## 这次排查到的两个真实坑

### 1) 向量维度不能想当然写死

这个坑不是凭空出现的，而是我在“切换模型供应商做对比测试”时真实踩出来的。

一开始我用的是千问，后面为了顺手测一下其他家的效果，又把当前配置切到了 `GLM`，也顺带想试下 `DeepSeek` 一类模型。

看起来只是“换一个 key”，但实际会牵出一串配置差异：

- `OPENAI_BASE_URL` 要跟着切
- 聊天模型和向量模型的接口地址不一定相同
- `LLM` 模型名和 `Embedding` 模型名也要分开配置
- 不同平台对“向量维度”的支持方式也不一样

这里最容易忽略的就是最后一点：

- 千问有些向量模型支持显式指定维度
- 但切到别的供应商后，维度可能不是你手动写死的，而是模型实际返回多少就是多少

我这次就是一开始把集合里的 `vector dim` 写成了 `1024`，但当前 embedding 模型实际返回的是 `256` 维。

这会导致：

- 集合 schema 和 embedding 输出不一致
- 插入时可能失败
- 查询时也会因为 query embedding 和库存向量维度不一致而报错

所以更稳的做法是：

- 先明确区分 `LLM` 配置和 `Embedding` 配置，不要混在一起理解
- 切换供应商时，同时检查 `baseURL`、聊天模型名、向量模型名是否都对应正确
- 先用 embedding 模型试算一次，拿到“真实返回维度”
- 用这个真实维度去创建 collection
- 并保证“写入时用的 embedding 模型”和“查询时用的 embedding 模型”维度一致

这次的教训其实很实在：

- RAG 里的向量库不是只要“能连上”就行
- 只要换了模型供应商，就要重新确认一遍 embedding 相关配置
- 尤其是“插入”和“查询”两端，必须使用兼容的向量维度，否则问题一定会在后面暴露出来

### 2) Milvus 的 `insert_cnt = 0` 不一定代表“代码没跑”

这次更隐蔽的问题其实是：

- 某条 `tags` 的中文内容过长
- schema 里 `tags.max_length` 设得太小
- 导致整批插入被 Milvus 拒绝

也就是说，表面看是：

- 代码正常执行完
- `Inserted 0`

但本质上其实是：

- 批量写入整批失败
- 只是 SDK 没直接 throw

这给我的提醒是：

1. 不能只看 `insert_cnt`
2. 要检查 `result.status`
3. 最后还要 `flush + getCollectionStatistics` 看真实行数

### 3) 记录主键 `id` 不能只靠标题生成

最开始我把很多 record 的 `id` 设计成了：

- `sourceId + section + subsection + entityType + title`

这看起来没问题，但一到真实数据就暴露问题：

- 同一个 subsection 下会有多条 bullet
- 它们的 title 其实是一样的
- 于是会出现大量重复 id

比如 `AI Agent 开发` 小节下的多条技能点，标题都还是 `AI Agent 开发`。

这说明：

- “认知看来是不同内容”
- 但“主键设计里却被当成同一条”

后面修复成：

- 保留可读的结构前缀
- 再拼一段 `content hash`

这样既能看懂，又能保证唯一性。

### 4) `drop -> create -> load` 之间可能有短暂时序问题

这次还有一个很像“玄学”的报错：

- 集合明明刚创建成功
- 紧接着 `loadCollection`
- 却提示 `collection not found`

这不是代码逻辑错了，而更像是：

- Milvus 元数据刚更新
- QueryCoord / 其他内部组件还没完全感知到

解决方式不是大改，而是：

- 对这类短暂错误做轻量重试
- 间隔几百毫秒再试

对 demo 来说，这样更稳，也更贴近真实工程里的防抖思路。

## 实际排查过程复盘

这次不是一步到位解决的，而是连续排了几层：

1. **先看现象**
   - `inspect` 正常
   - `ingest` 也打印了记录预览
   - 但 Milvus 里查不到数据

2. **第一反应：是不是向量维度错了**
   - 实测当前 embedding 返回 `256` 维
   - 旧 collection 却是 `1024` 维
   - 先修复为“动态探测维度后建表”

3. **再次验证：还是 0 条**
   - 说明问题不止一个
   - 继续查 `insert result` 和真实 stats

4. **定位到真正导致整批失败的点**
   - `tags` 某一项长度超出 schema 限制
   - Milvus 拒绝了整批 77 条
   - 但 SDK 没直接 throw

5. **继续往后收口**
   - 增加 `result.status` 显式校验
   - `flush` 后再查 `row_count`
   - 对字符串字段做字节级 trim
   - 修复重复 id
   - 给 `loadCollection` 加重试

最终才真正稳定写入成功。

## 这次问题最终是怎么解决的

最后采用的是一组组合修复，而不是单点修复：

1. collection 向量维度改为动态探测
2. 如果旧 collection 维度不一致且为空，自动删掉重建
3. 批量插入后强制检查 `result.status`
4. `flush` 后再查真实 `row_count`
5. `tags / title / subsection` 做长度兜底
6. `id` 加入内容 hash，避免重复
7. `loadCollection` 遇到短暂时序问题时做重试

这也说明一个很重要的学习点：

- 真正的工程排查，往往不是“一个 bug，一个答案”
- 而是“先排掉第一层，再暴露第二层，最后把整个链路补稳”

## 当前阶段得到的工程经验

- 简历类数据很适合先做“语义字段拆分”，再做向量化
- collection schema 里的字符串长度，尤其中文场景，要按“字节风险”预留余量
- 记录主键 `id` 不能只靠标题生成，否则很容易重复
- demo 能跑通后，下一步更值得关注的是检索命中质量，而不只是“有没有写进去”

## 这轮字段复盘：当前 schema 暴露出的几个问题

在重新导入成功、Milvus 中已经能看到 77 条记录后，我又随机抽查了几条真实数据，开始从“能跑”进入“字段设计是否合理”的复盘。

### 1) `chunk_index / chunk_count` 目前几乎没有发挥作用

当前这 77 条记录里，几乎都是：

- `chunk_index = 0`
- `chunk_count = 1`

这说明当前这版简历数据，实际上大多数 record 都没有进入“第二层 chunk”。

也就是说：

- 设计上这两个字段是合理的
- 但在当前这份简历上，它们暂时没有提供额外的信息增量

因此可以把它们理解成：

- 为未来长字段二次切块预留的字段
- 而不是当前 demo 的核心观察字段

### 2) `id` 当前偏长，可读但不够利落

例如：

```text
fuyinsheng-resume-zh:work_experience:成都一蟹科技有限公司-2024-03-2024-08:experience_detail_1:成都一蟹科技有限公司-2024-03-2024-08:a3373f5149
```

它的问题不是“不能用”，而是：

- 可读性有些过度设计
- 结构信息和其他字段大量重复
- 调试时不够利落
- 一旦 subsection 命名规则变化，`id` 也会跟着变得很重

当前这版 `id` 方案适合排查阶段，但如果想更接近正式工程方案，后面应该收敛。

### 3) `source_id` 不冗余，但不必在 `id` 里展开太多

`source_id` 本身仍然是有价值的字段，因为它承担了：

- 标识来自哪份简历
- 支持“按 source 全量覆盖删除”
- 支持未来多份简历共用一个 collection
- 支持按来源过滤

但它不需要在 `id` 里重复承担太多展示职责。

另外，`locale` 既然已经有独立字段，就没有必要再隐含进 `id` 里。

更准确地说：

- `source_id` 字段应该保留
- 但 `id` 里对 `source_id / locale` 的展开可以收缩

### 4) `subsection / entity_type / title` 不是没依据，而是职责有些混杂

这几个字段最初的设计意图其实是合理的：

- `subsection`：给检索结果一个稳定的小节标识
- `entity_type`：区分 `summary / detail / skill_item / education_item`
- `title`：给人类展示

问题不是“有没有必要”，而是“当前命名风格不统一”：

- `section / entity_type` 偏英文工程 key
- `title / tags` 偏中文展示文案
- `subsection` 有时像 slug key，有时又兼带展示语义

于是看起来就会出现一种“中英文混杂、职责重叠”的感觉。

这说明当前真正的问题不是字段太多，而是：

- 程序标识字段
- 展示语义字段

还没有彻底分层。

## 推荐 schema 重构方案（先确认，再改代码）

如果把当前 demo 再往“更像正式方案”推进一步，我更推荐把字段职责收敛成两类：

### A. 程序友好字段

这些字段主要服务于：

- 过滤
- 去重
- 召回分析
- 后端逻辑

建议保留：

- `id`
- `source_id`
- `locale`
- `section`
- `subsection_key`
- `entity_type`
- `chunk_index`
- `chunk_count`
- `vector`

### B. 展示友好字段

这些字段主要服务于：

- 调试查看
- 前端展示
- 生成回答时的上下文可读性

建议保留：

- `subsection_title`
- `content`
- `tags`

其中 `title` 这个字段我更倾向于弱化，甚至可以去掉。

原因是当前它和 `subsection_title` 的职责高度接近，而且在很多记录里，它其实只是重复了一遍 subsection 的展示语义。

## 我推荐的下一版字段清单

### 建议保留的字段

- `id`
- `source_id`
- `locale`
- `section`
- `subsection_key`
- `subsection_title`
- `entity_type`
- `content`
- `tags`
- `chunk_index`
- `chunk_count`
- `vector`

### 建议弱化或删除的字段

- `title`

如果后面发现 `title` 和 `subsection_title` 完全重叠，那就直接去掉，避免一份语义存两份近似字段。

## 推荐的字段职责定义

### 1) `section`

一级分类，稳定英文 key，只服务程序逻辑。

例如：

- `profile`
- `core_strengths`
- `education`
- `skills`
- `work_experience`
- `projects`

### 2) `subsection_key`

二级分类的稳定 key，只服务程序逻辑，不承担展示职责。

例如：

- `core-strengths`
- `ai-agent-development`
- `my-resume-2026-03-至今`

### 3) `subsection_title`

二级分类的展示标题，面向人类。

例如：

- `核心竞争力`
- `AI Agent 开发`
- `my-resume （2026.03 - 至今）`

### 4) `entity_type`

块类型，稳定英文 key。

例如：

- `profile_summary`
- `strength_item`
- `skill_item`
- `education_item`
- `experience_summary`
- `experience_detail_1`
- `project_summary`
- `project_detail_2`

### 5) `id`

只承担“唯一键”职责，不再承担太多展示职责。

推荐收缩为：

```text
resume:{section}:{entity_type}:{content_hash}
```

例如：

```text
resume:work_experience:experience_detail_1:a3373f5149
```

这已经足够：

- 可读
- 唯一
- 稳定

没有必要再把整段 subsection 和 title 都拼进去。

## 为什么我推荐这样改

因为当前最核心的问题已经不是“字段够不够”，而是“字段是否各司其职”。

如果继续沿用当前方案，会出现这些问题：

- `id` 太长，承担了太多展示责任
- `subsection` 同时承担“key + 标题”的混合职责
- `title` 和 `subsection` 存在语义重叠
- 中英混杂会让 schema 的认知成本越来越高

而按推荐方案收敛后，字段角色会清晰很多：

- 程序字段只负责稳定和可过滤
- 展示字段只负责可读
- 唯一键只负责唯一

这会让后续无论是：

- 接入 `my-resume`
- 做前端展示
- 做混合召回
- 做 rerank

都更顺。

## 当前我的判断

这套 demo 现在已经证明：

- “语义字段拆分 + 向量化写入”路线是成立的
- parser / ingest / ask 主链路也是成立的

下一步不应该急着继续堆功能，而应该优先做一次“小而明确”的字段收敛。

也就是说，接下来最值得做的不是“大改逻辑”，而是：

1. 明确字段职责
2. 收缩 `id`
3. 把 `subsection` 拆成 `subsection_key + subsection_title`
4. 评估是否删除 `title`

这一步确认清楚后，再改代码，会比边改边想更稳。

# my-resume：AI / RAG 学习引导与真实链路说明

## 一、这份文档写给谁

这份文档主要写给两类人：

- 想继续理解 `my-resume` 里 AI / RAG 接口到底是怎么工作的你自己
- 以后接手这条线、但不想一头扎进代码细节里的人或 Agent

尤其适合下面这种情况：

- 你知道项目里已经有 AI 接口和 RAG
- 你也知道代码已经跑起来了
- 但因为很多实现不是自己一点点手写出来的，所以会有一种感觉：

> 功能我知道在，代码我也看到了，但我还没有真正“吃透它为什么这样运作”。

这份文档的目标，就是把这条线从“已经生成出来”重新拉回到“我能看、能接、能校、能继续长”的状态。

## 二、先给一个总图：`my-resume` 里 AI / RAG 现在在做什么

如果只用一句话总结：

> 当前 `my-resume` 已经具备“输入内容 -> AI 分析 / 优化 -> RAG 检索 / 问答”的最小后端闭环。

拆开来看，一共是三条主线：

### 1. 文件提取线

- 上传 `txt / md / pdf / docx`
- 服务端抽取文本
- 返回给后台 AI 工作台继续分析

### 2. AI 分析与简历优化线

- 输入一段内容或当前草稿
- 服务端调用 Provider 生成分析结果
- 或生成结构化简历 patch
- 再把 patch 应用回当前草稿

### 3. RAG 检索与问答线

- 读取结构化简历 YAML 与博客 Markdown
- 切成 chunk
- 做 embedding
- 写成本地 JSON 索引
- 再通过 `search / ask` 提供检索与问答

也就是说，当前这套实现不是“一个孤立 AI 按钮”，而是一条已经具备上下游关系的真实链路。

## 三、从目录上认识这条链路

如果你现在要开始学，不要先看所有代码。

先只记住这几个目录：

### 1. AI 模块总入口

- `apps/server/src/modules/ai/ai.module.ts`

这是最适合开始读的地方，因为它告诉你：

- 当前有哪些 controller
- 当前有哪些 service
- Provider 是怎么注入进来的
- RAG 这条线和普通 AI 分析是怎样共用基础设施的

### 2. Provider 与统一 AI 调用层

- `apps/server/src/modules/ai/config/ai-config.ts`
- `apps/server/src/modules/ai/providers/ai-provider.factory.ts`
- `apps/server/src/modules/ai/providers/openai-compatible-ai.provider.ts`
- `apps/server/src/modules/ai/providers/mock-ai.provider.ts`
- `apps/server/src/modules/ai/ai.service.ts`

这几层解决的是：

- 到底用哪个 provider
- 用哪个 chat model
- 用哪个 embedding model
- 统一从哪里发起文本生成和向量化

### 3. AI 接口入口

- `apps/server/src/modules/ai/ai-file.controller.ts`
- `apps/server/src/modules/ai/ai-report.controller.ts`
- `apps/server/src/modules/ai/ai-resume-optimization.service.ts`

这几层解决的是：

- 文件怎么提取
- 分析接口怎么设计
- 简历优化 patch 怎么生成和应用

### 4. RAG 主线

- `apps/server/src/modules/ai/rag/rag.controller.ts`
- `apps/server/src/modules/ai/rag/rag.service.ts`
- `apps/server/src/modules/ai/rag/rag-chunk.service.ts`
- `apps/server/src/modules/ai/rag/rag-knowledge.service.ts`
- `apps/server/src/modules/ai/rag/rag-index.repository.ts`

这几层解决的是：

- 简历和博客怎么变成 chunk
- chunk 怎么 embedding
- 索引怎么写到本地 JSON
- 检索和问答怎么做

## 四、AI 接口真实是怎么走的

## 1. 文件提取接口

入口：

- `POST /ai/extract-text`
- 代码：`apps/server/src/modules/ai/ai-file.controller.ts`

执行顺序：

1. 前端上传文件
2. `AiFileController` 接到文件
3. 交给 `FileExtractionService`
4. 根据扩展名分别走：
   - `txt / md`：直接读文本
   - `pdf`：`pdf-parse`
   - `docx`：`mammoth`
5. 返回标准化文本与字符数

关键理解：

这条线的本质不是“AI”，而是**给后续 AI 提供稳定输入**。

如果输入层不统一，后面分析、缓存、RAG 都会变得不稳。

## 2. AI 分析接口

入口：

- `GET /ai/reports/runtime`
- `GET /ai/reports/cache`
- `GET /ai/reports/cache/:reportId`
- `POST /ai/reports/cache`
- `POST /ai/reports/analyze`

代码：

- `apps/server/src/modules/ai/ai-report.controller.ts`
- `apps/server/src/modules/ai/analysis-report-cache.service.ts`

执行顺序：

1. 前端把场景和文本发给 `/ai/reports/analyze`
2. `AiReportController` 先构建 prompt
3. 通过 `AiService.generateText()` 调用当前 provider
4. 返回文本后交给 `AnalysisReportCacheService`
5. 服务端把自由文本或 JSON 结构化成：
   - `summary`
   - `score`
   - `strengths`
   - `gaps`
   - `risks`
   - `suggestions`
6. 最终把结构化报告返回给前端

关键理解：

这条线并不是“把模型输出原样交给前端”，而是：

> 用服务端把 AI 输出收成当前项目能稳定消费的结构。

这就是为什么你现在在项目里看到的不是一堆随意文本，而是越来越明确的结论层、依据层、建议层。

## 3. AI 简历优化接口

入口：

- `POST /ai/reports/resume-optimize`
- `POST /ai/reports/resume-optimize/apply`

代码：

- `apps/server/src/modules/ai/ai-resume-optimization.service.ts`

执行顺序：

1. 先读取当前 draft
2. 根据 instruction 构建 prompt
3. 调 `AiService.generateText()`
4. 如果是 mock，直接生成 deterministic suggestion
5. 如果是真实 provider，要求它只输出 JSON patch
6. 服务端验证 patch
7. 把 patch 合并回当前 `StandardResume`
8. 做结构校验
9. 返回：
   - `suggestedResume`
   - `changedModules`
   - `moduleDiffs`
   - `applyPayload`
10. 用户确认后，再走 `/apply` 写回 draft

关键理解：

这条线不是“让 AI 自由重写整份简历”，而是：

> 让 AI 返回结构化 patch，再由服务端把 patch 合并回当前简历模型。

这个边界非常重要，因为它直接决定了风险是否可控。

## 五、RAG 真实是怎么走的

## 1. 当前数据源是什么

当前主知识源有两类：

### 简历结构化源

- `apps/server/data/rag/resume.zh.yaml`

### 博客知识源

- `blog/*.md`

也就是说，当前 RAG 不是只回答“简历字段”，而是已经可以回答：

- 履历内容
- 博客里关于 RAG / Agent 的公开文章内容

## 2. 索引是怎么建的

入口：

- `POST /ai/rag/index/rebuild`

主流程代码：

- `apps/server/src/modules/ai/rag/rag.service.ts`

执行顺序：

1. `RagService` 读取 `resume.zh.yaml`
2. 交给 `RagChunkService.parseSource()`
3. 再由 `RagChunkService.buildChunks()` 生成简历 chunk
4. 同时读取 `blog/*.md`
5. 交给 `RagKnowledgeService` 解析 frontmatter 和 `##` 标题
6. 生成文章知识 chunk
7. 把所有 chunk 内容统一送给 `AiService.embedTexts()`
8. 得到 embedding 后写入：
   - `apps/server/storage/rag/resume-index.json`

关键理解：

RAG 的第一步不是问答，而是：

> 先把源内容切成适合检索的知识块，并为每块生成 embedding。

## 3. 当前 chunk 是怎么切的

简历 YAML 不是按“字数”切，而是按“语义块”切：

- `profile`
- `strengths`
- `skills`
- `education`
- `experience`
- `project`
- `extra`

博客文章则按：

- frontmatter
- `##` 标题分段

这样做的原因很简单：

- 简历本身就是结构化知识
- 博客本身就是章节化知识

所以当前最适合的切法，不是硬切长度，而是按语义块切。

## 4. 当前搜索是怎么做的

入口：

- `POST /ai/rag/search`

主逻辑：

- `apps/server/src/modules/ai/rag/rag.service.ts`

当前搜索分值由两部分组成：

1. **cosine similarity**
   - 查询 embedding vs chunk embedding
2. **keyword score**
   - 查询词是否直接命中 chunk 文本

最后按加权结果排序。

关键理解：

这不是最复杂的检索方案，但对当前项目很合适，因为它已经满足：

- 能工作
- 能解释
- 能测试

## 5. 当前问答是怎么做的

入口：

- `POST /ai/rag/ask`

执行顺序：

1. 先调用 `search()`
2. 取前 `N` 条结果
3. 把它们拼成上下文
4. 再调用 `AiService.generateText()`
5. 返回：
   - `answer`
   - `matches`
   - `providerSummary`

所以当前 `ask` 的本质是：

> 先检索，再把检索到的内容作为上下文交给模型总结回答。

这就是 RAG 最核心的主流程。

## 六、如果代码不是自己一点点写出来的，该怎么学

这件事很重要。

很多时候我们会误以为：

> 只有自己一行一行写出来，才算真正理解。

其实不是。

在 AI 时代，更有效的学习方式往往是：

## 1. 先抓入口

不要一上来读整个模块。

先抓：

- controller
- service
- test

因为入口最能回答：

- 这个功能从哪里进
- 最后返回什么
- 中间主要经过哪几层

## 2. 再抓输入输出

对任何一个 AI / RAG 功能，先只问三个问题：

- 输入是什么
- 输出是什么
- 中间哪里在做转换

例如：

- `extract-text`：文件 -> 文本
- `analyze`：文本 -> 结构化分析报告
- `resume-optimize`：instruction + draft -> patch + suggestedResume
- `rag/rebuild`：源文件 -> chunk -> embedding -> JSON index
- `rag/ask`：question -> search -> context -> answer

## 3. 最后用测试反推实现

如果你没有完整手写这段代码，测试就是你最好的老师。

因为测试会明确告诉你：

- 这个模块最重要的行为是什么
- 哪些边界是被故意锁住的
- 作者真正关心什么

在当前仓库里，建议你重点看：

- `apps/server/src/modules/ai/rag/__tests__/rag.service.spec.ts`
- `apps/server/test/ai-rag.e2e-spec.ts`
- `apps/server/src/modules/ai/config/__tests__/ai-config.spec.ts`
- `apps/server/src/modules/ai/__tests__/ai-resume-optimization.service.spec.ts`

## 七、我建议你的阅读顺序

如果你现在想真正把这条线学进去，我建议按这个顺序看：

### 第一步：先理解模块组装

看：

- `apps/server/src/modules/ai/ai.module.ts`

目标：

- 先知道 AI 模块里有哪些拼图

### 第二步：看统一 Provider 层

看：

- `apps/server/src/modules/ai/config/ai-config.ts`
- `apps/server/src/modules/ai/providers/ai-provider.factory.ts`
- `apps/server/src/modules/ai/ai.service.ts`

目标：

- 理解“文本生成”和“向量生成”到底是怎么被统一封装的

### 第三步：看最简单的接口

看：

- `apps/server/src/modules/ai/ai-file.controller.ts`
- `apps/server/src/modules/ai/file-extraction.service.ts`

目标：

- 从最简单的“文件 -> 文本”开始，进入 AI 模块

### 第四步：看分析与优化

看：

- `apps/server/src/modules/ai/ai-report.controller.ts`
- `apps/server/src/modules/ai/analysis-report-cache.service.ts`
- `apps/server/src/modules/ai/ai-resume-optimization.service.ts`

目标：

- 理解 AI 接口为什么要在服务端把结果收成结构化契约

### 第五步：看 RAG

看：

- `apps/server/src/modules/ai/rag/rag.controller.ts`
- `apps/server/src/modules/ai/rag/rag.service.ts`
- `apps/server/src/modules/ai/rag/rag-chunk.service.ts`
- `apps/server/src/modules/ai/rag/rag-knowledge.service.ts`

目标：

- 真正理解“索引怎么建，搜索怎么做，问答怎么接”

### 第六步：看测试

看：

- `apps/server/src/modules/ai/rag/__tests__/rag.service.spec.ts`
- `apps/server/test/ai-rag.e2e-spec.ts`

目标：

- 用测试把这条链路再反推一遍

## 八、你应该怎么自己动手测试

## 1. 先跑最小 unit test

建议先跑：

```bash
pnpm --filter @my-resume/server test -- src/modules/ai/rag/__tests__/rag-chunk.service.spec.ts src/modules/ai/rag/__tests__/rag.service.spec.ts
```

你会先看到：

- chunk 是怎么构造的
- search / ask 是怎么工作的

## 2. 再跑 RAG e2e

```bash
pnpm --filter @my-resume/server test:e2e -- test/ai-rag.e2e-spec.ts
```

这个测试能帮你确认：

- rebuild 能不能成功
- search 能不能命中
- ask 能不能返回答案

## 3. 再跑 server 全量单测

```bash
pnpm --filter @my-resume/server test
pnpm --filter @my-resume/server typecheck
```

这样你才能知道：

- 你理解的不是局部，而是这个 server 目前整体仍稳定

## 4. 最后做一次手工实验

建议你自己做一个很小的实验：

1. 改 `apps/server/data/rag/resume.zh.yaml`
2. 新增一条明显的 `strengths`
3. 执行 rebuild
4. 再用 `search` 查这条内容

如果这条实验你自己能跑通，你对当前 RAG 的理解就已经比“只是读过代码”更深了一层。

## 九、如果你接下来想继续学，应该优先学什么

基于当前 `my-resume` 的状态，我建议你的学习顺序是：

### 1. 先把“当前最小 RAG 主流程”吃透

重点不是更多算法，而是：

- 数据源
- 切片
- embedding
- 检索
- 问答

### 2. 再理解“结构化 AI 输出为什么重要”

重点看：

- `analysis-report-cache.service`
- `ai-resume-optimization.service`

因为这两层会帮你理解：

> 为什么 AI 项目不能只停在“模型说了什么”，而要进一步收成“系统能稳定消费的契约”。

### 3. 最后再进入更复杂的话题

例如：

- RAG stale 判断
- metadata
- re-ranking
- 多轮上下文
- Agent 级编排

这些都重要，但应该建立在你已经吃透当前最小闭环之后。

## 十、你现在最该抓住的学习心法

如果只留一句话给现在的你，我会建议是：

> 不要因为这段代码不是自己一行一行敲出来，就觉得它“不算理解”；你现在真正要练的，是如何从入口、数据、状态和测试，把已经生成出来的系统重新读成你自己的东西。

这也是当前 `Dao-is-Coding` 那个思路很重要的原因。

我们要补的，不只是“让 AI 生成”，而是：

- 我知道它为什么这样长出来
- 我知道它现在长到哪
- 我知道它哪里可能长歪
- 我知道下一轮从哪里接着长

而当前这份 `my-resume` 的 AI / RAG 代码，正好就是一个很好的练习场。

## 十一、一句话总结

当前 `my-resume` 里的 AI / RAG 不是“神秘黑盒”，而是一条已经可以被拆成：

- 输入层
- Provider 层
- 分析层
- 优化层
- RAG 索引层
- 检索与问答层
- 测试验证层

的真实系统。

你接下来真正要做的，不是把所有代码背下来，而是学会沿着这条链路去看：

- 接口从哪进
- 数据怎么变
- 状态怎么留
- 结果怎么验

这样你才会慢慢把“代码已经生成了”变成“这套系统我真的能接住了”。

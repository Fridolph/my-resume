# M15 / issue-161 ~ 163 开发日志：server AI / RAG 基线收口

- Issue：`#161` `#162` `#163`
- 里程碑：`M15 AI / RAG 能力深化`
- 分支：`fys-dev/feat-m15-issue-161-163-ai-rag-tightening`
- 日期：`2026-04-07`

## 背景

在 `M12 ~ M14` 之后，仓库里的 AI / RAG 主线已经具备最小闭环：

- 可以提取文件文本
- 可以做分析与结构化简历建议
- 可以对简历和博客知识源做最小 RAG 检索与问答

但继续往下走时，出现了三个比较典型的问题：

1. 最新简历内容虽然已经更新到 `public/web_fuyinsheng_10y.md`，但 RAG 知识源还需要继续同步关键表达
2. `generateText` 与 `embedTexts` 仍共用同一个 `model` 概念，配置语义不够清楚
3. RAG 虽然能工作，但当前运行态和索引摘要还不够适合调试、教学与后续接棒

另外，`apps/server/src` 下的单测文件仍散落在实现文件旁边，不符合当前仓库优先收敛到 `__tests__/` 的约定。

所以这轮的重点不是“继续扩 AI 能力”，而是先把当前 server 侧 AI / RAG 的基础边界收清。

## 本次目标

- 同步最新简历信号到当前 RAG 知识源
- 拆分 chat model 与 embedding model 配置
- 补强 RAG 状态接口与索引运行时信息
- 将 `apps/server/src` 下的 unit spec 迁移到对应 `__tests__/` 目录

## 非目标

- 不引入新的 AI Provider
- 不引入向量数据库
- 不做 RAG stale 自动重建
- 不重做 admin 侧 AI 工作台界面
- 不扩展新的业务入口或新的角色模型

## TDD / 测试设计

### 1. 先锁 AI runtime config 行为

更新：

- `apps/server/src/modules/ai/config/__tests__/ai-config.spec.ts`
- `apps/server/src/modules/ai/providers/__tests__/openai-compatible-ai.provider.spec.ts`
- `apps/server/src/modules/ai/providers/__tests__/mock-ai.provider.spec.ts`
- `apps/server/src/modules/ai/__tests__/ai.service.spec.ts`

验证：

- 默认 mock 配置可返回 `chatModel / embeddingModel`
- OpenAI-compatible provider 的聊天与 embeddings 请求可使用不同模型
- 统一 `AiService` 仍保持调用入口不变

### 2. 再锁 RAG 知识源与状态摘要

更新：

- `apps/server/src/modules/ai/rag/__tests__/rag-chunk.service.spec.ts`
- `apps/server/src/modules/ai/rag/__tests__/rag.service.spec.ts`
- `apps/server/test/ai-rag.e2e-spec.ts`

验证：

- 最新简历中的 `strengths` 可被切成稳定语义块
- `search` 能命中新增的 AI / OpenClaw 相关内容
- `status / rebuild` 能返回 provider summary 与索引构建摘要

### 3. 最后用 server 全量单测回归目录迁移

迁移：

- `apps/server/src/**/__tests__/`

验证：

- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server typecheck`

这样可以确认本轮不只是局部逻辑通过，而是测试结构调整后整体仍然稳定。

## 实际改动

## 1. RAG 知识源继续对齐最新简历内容

更新：

- `apps/server/data/rag/resume.zh.yaml`
- `apps/server/src/modules/ai/rag/rag-chunk.service.ts`

本轮在现有简历 YAML 主源里补充了：

- `strengths` 字段
- 更强的 AI Agent / OpenClaw / Vibe Coding 信号
- 更适合当前 RAG 命中的项目与能力表述

然后在 `RagChunkService` 里新增了 `strengths-overview` 语义块。

这样做的价值是：

- 让最新简历内容不只存在于 Markdown 文本中
- 也能稳定进入当前 RAG 的结构化知识源
- 后续 `search / ask` 更容易命中这些高价值信号

## 2. AI Provider 增加 `chatModel / embeddingModel`

更新：

- `apps/server/src/modules/ai/config/ai-config.ts`
- `apps/server/src/modules/ai/interfaces/ai-provider.interface.ts`
- `apps/server/src/modules/ai/providers/openai-compatible-ai.provider.ts`
- `apps/server/src/modules/ai/providers/mock-ai.provider.ts`

这轮把原来相对混合的 `model` 语义拆成了：

- `chatModel`
- `embeddingModel`

同时保留：

- `model` 作为当前兼容字段

也就是说，这轮不是彻底推翻旧配置，而是在不打断现有链路的前提下，先把“聊天模型”和“向量模型”的职责边界说明白。

这一步非常关键。因为 AI 分析、简历优化和 RAG 向量化虽然都在复用同一套基础设施，但它们不一定长期使用同一个模型。

## 3. RAG 状态接口补充运行时摘要

更新：

- `apps/server/src/modules/ai/rag/rag.service.ts`
- `apps/server/src/modules/ai/rag/rag.types.ts`

当前 `getStatus()` 与 `rebuildIndex()` 现在会返回：

- 当前 `providerSummary`
- 索引构建时的 `indexedProviderSummary`
- `resumeChunkCount / knowledgeChunkCount`
- `generatedAt`

这让 RAG 当前不只是“能用”，而是更容易回答这些问题：

- 现在到底在用哪个 provider
- 当前 chat / embedding 模型是什么
- 当前索引是什么时候生成的
- 当前简历源和知识库源各有多少块

这类信息对后续教学、调试和 Agent 接棒都很重要。

## 4. `apps/server/src` 下的 unit spec 统一迁移到 `__tests__`

更新范围：

- `apps/server/src/__tests__/`
- `apps/server/src/config/__tests__/`
- `apps/server/src/database/__tests__/`
- `apps/server/src/modules/**/__tests__/`

本轮把散落在实现文件旁边的 `.spec.ts` 全部迁到了对应 `__tests__/` 目录，并同步修正了相对导入路径。

这里的目的不是重构测试逻辑，而是统一目录约定，方便：

- 后续继续补单测
- 更快看清“实现文件”和“测试文件”的职责边界
- 保持和仓库当前的测试组织规范一致

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本轮只完成：

- 最新简历知识源补强
- chat / embedding 配置拆分
- RAG 状态信息补强
- server unit spec 目录收口

没有越界去做：

- RAG stale 判断
- 新的 AI 功能入口
- 向量数据库升级
- admin 侧 RAG 状态面板

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

有两个后续方向已经更清楚了：

1. `Rag` 这条线后续可以继续补 `stale / hash / source metadata`
2. AI Provider 配置后续可以继续独立沉淀“聊天模型 / embedding 模型 / provider summary”的共享约定

但当前先停在“把基础边界收清”更合适。

### 本次最重要的边界判断

这轮最关键的判断不是“让 AI 能力变多”，而是：

- 让知识源更接近真实最新内容
- 让模型配置的职责更清楚
- 让 RAG 当前状态更可见

也就是说，这轮是在把 AI / RAG 从“能跑通”往“更可判断、更可解释、更可接棒”推进。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server test -- src/modules/ai/config/ai-config.spec.ts src/modules/ai/providers/openai-compatible-ai.provider.spec.ts src/modules/ai/providers/mock-ai.provider.spec.ts src/modules/ai/ai.service.spec.ts src/modules/ai/rag/rag-chunk.service.spec.ts src/modules/ai/rag/rag.service.spec.ts`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-rag.e2e-spec.ts`
- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server typecheck`

结果：

- AI runtime config 相关测试通过
- RAG 服务层与 e2e 通过
- server 全量 unit test 通过
- server 类型检查通过

## 遇到的问题

### 1. “最新 AI 信号”不一定天然能被当前查询词命中

问题：

即使已经把 `OpenClaw` 等内容加入简历源，如果查询词中同时混入大量通用词，搜索结果也可能优先命中别的知识块。

处理：

- 测试里把断言从“首条必须命中”放宽为“命中结果集合里包含目标语义块”
- 保持当前检索排序策略不被这一轮顺手重做

### 2. mock 模式下的 `embeddingModel` 与 `chatModel` 需要明确默认值

问题：

如果 mock 只保留一个模型名，后续测试里无法直观看到“聊天模型”和“向量模型”是否真的被区分。

处理：

- 为 mock 默认补上独立的 `embeddingModel`
- 让测试可以更明确地锁住这层边界

### 3. 测试迁移后最容易出错的是相对路径

问题：

`.spec.ts` 从实现文件同级迁到 `__tests__/` 后，很多相对导入路径都会失效。

处理：

- 先统一迁移目录
- 再批量修正相对引用
- 最后跑全量 server 单测做回归

## 可沉淀为教程 / 博客的点

- 为什么 AI 项目里“聊天模型”和“向量模型”应该尽早拆开
- 为什么当前阶段的 RAG 更应该先做“状态可见”，而不是立刻做更复杂的检索增强
- 如何把“最新简历内容”同步成适合当前 RAG 的结构化知识源
- 为什么测试目录迁移也是教程型仓库里很重要的一次收口动作

## 后续待办

- `#164`：RAG 索引过期判断与源变更感知
- 继续考虑是否给 RAG chunk 增加更多 metadata
- 后续可在 admin 中继续补 RAG 状态或重建入口
- 当前阶段先保持 AI / RAG 基线清晰稳定即可

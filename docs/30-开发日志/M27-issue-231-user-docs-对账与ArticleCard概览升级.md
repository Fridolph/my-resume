# M27 / issue-231 user_docs 对账与 ArticleCard 概览升级

- Issue：#231
- 里程碑：M27 多域 RAG 路由修正与补充知识库检索收口
- 分支：`fys-dev/fix-m26-ai-chat-daily-turn-reset`
- 日期：2026-06-15

## 背景

这轮收口之前，`user_docs` 补充知识链路已经能入库、能检索，但还存在几个比较影响体验和治理的问题：

- `ArticleCard` 展示概览并不稳定，`summary` 只在部分层级存在，没有真正贯通到 server / admin / api-client。
- 标题型补充资料问题虽然已经有 catalog probe 能力，但缺少围绕单文档锚定、citation 去重和测试的正式收口。
- Admin 虽然已经写了 `user_docs` 导出 / 清空 / 对账的 handler，但入口与测试还没有完整闭环。
- Milvus 相关测试依赖真实端口环境，容易因为本地服务状态不同而抖动。

因此这轮的目标不是继续扩架构，而是把现有 M27.4 能力补齐成“可验证、可维护、可回看”的状态。

## 本次目标

- 为 `user_docs` 建立更完整的管理闭环：
  - 导出快照
  - 清空真源与向量
  - 对账重建向量
- 打通 `summary` / article overview 到 `ArticleCard` 的完整链路
- 让标题型补充资料检索与 citation 收口具备明确测试
- 让 Admin 端查看 / 编辑 / 导出 / 清空路径都可用

## 非目标

- 不迁移 `resume_core` 到新的物理索引链路
- 不引入多张新的 RAG 业务表
- 不进入 LangGraph 多路由编排深化
- 不修改公开站 chat 的 wire shape

## TDD / 测试设计

- 先修已失败的 server 测试：
  - `user-docs-ingestion.service.spec.ts`
  - `vector-store/milvus.adapter.spec.ts`
- 再补 controller / admin / api-client 对 `summary`、导出、清空行为的覆盖
- 最后统一跑：
  - server vitest
  - admin vitest
  - `api-client` build
  - server/admin typecheck
  - `pnpm check:tsx-types`
  - `git diff --check`

这样可以先把语义跑通，再做 issue 收口，避免出现“代码像完成了，但测试与验收还没站住”的情况。

## 实际改动

### 1. `summary` / ArticleCard 概览链路补齐

更新：

- `apps/server/src/modules/ai/rag/user-docs-ingestion.service.ts`
- `apps/server/src/modules/ai/rag/rag.controller.ts`
- `apps/server/src/modules/ai/rag/rag.types.ts`
- `apps/server/src/modules/ai/chat/ai-chat-graph.service.ts`
- `packages/api-client/src/{ai.ts,types/ai.types.ts}`
- `apps/admin/app/[locale]/dashboard/ai/_ai/rag-manage-shell.tsx`

关键点：

- `RagRichCardMetadata` 增加 `summary?: string`
- 自定义 `user_docs` 入库和更新时：
  - 优先使用手填 `summary`
  - 否则按正文自动生成短概览
- `articleSummary` 同步写入 document / chunk metadata
- `getDocumentDetail()`、列表、admin 编辑态都能回填 `summary`
- `AiChatGraphService` 构建 `article_card` / `hobby_card` / `media_card` / `project_card` 时，优先读取 `richCard.summary`

### 2. `user_docs` 管理动作补齐

更新：

- `apps/server/src/modules/ai/rag/rag-retrieval.repository.ts`
- `apps/server/src/modules/ai/rag/rag.controller.ts`
- `apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`
- `packages/api-client/src/{ai.ts,types/ai.types.ts}`
- `apps/admin/app/[locale]/dashboard/ai/_ai/rag-manage-shell.tsx`

新增能力：

- `POST /api/ai/rag/user-docs/export`
- `POST /api/ai/rag/user-docs/reset`
- 管理页真正渲染：
  - `备份 user_docs`
  - `清空 user_docs`
  - `同步 user_docs 向量`

这样 Admin 不再只有“写了 handler 但页面没入口”的半成品状态。

### 3. 标题型补充资料召回与去重收口

更新：

- `apps/server/src/modules/ai/rag/rag.service.ts`
- `apps/server/src/modules/ai/chat/ai-chat-graph.service.ts`

本轮确认并补测了几件关键事：

- `documentIds` 检索过滤会真正向下透传
- `supplement_only` 路径不会再默认混入 static knowledge / resume chunks
- `dedupeMatchesForAsk()` 会按 `documentId` 优先去重 citation
- `《Dao核心原理》` 这种标题型问题可以走 catalog probe + 单文档锚定链路

### 4. 测试稳定性修复

更新：

- `apps/server/src/modules/ai/rag/__tests__/vector-store/milvus.adapter.spec.ts`

之前 Milvus 失败测试依赖真实端口不可达，若本地正好开着 Milvus，测试就会误通过或误失败。

本轮改成显式 mock `MilvusVectorStoreUnavailableError`，让测试只验证适配器语义，不再依赖外部环境。

## Review 记录

- 是否符合当前 Issue 与里程碑目标：符合
- 是否存在范围外扩张：没有，本轮仍然只围绕 `user_docs`、ArticleCard summary、标题型补充资料召回和 Admin 管理动作
- 是否有可复用沉淀：有
  - `summary` 语义已经沉淀为可复用的 richCard metadata
  - `export/reset/reconcile` 形成了后续 `user_docs` 数据治理的最小基线
- 是否引入兼容风险：低
  - 公开 API 只是新增增强字段和管理端点，没有破坏旧 shape

## 自测结果

已通过：

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/rag.controller.spec.ts src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts src/modules/ai/rag/__tests__/vector-store/milvus.adapter.spec.ts src/modules/ai/chat/__tests__/ai-chat-graph.service.spec.ts src/modules/ai/rag/__tests__/rag.service.spec.ts --pool forks --poolOptions.forks.singleFork`
- `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/ai-file-api.spec.ts' 'app/[locale]/dashboard/ai/_ai/__tests__/rag-manage-shell.spec.tsx'`
- `pnpm --filter @my-resume/api-client build`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm check:tsx-types`
- `git diff --check`

说明：

- admin 测试中仍会看到 HeroUI `PressResponder` 的 warning，但当前不影响测试通过，也不是这轮 issue 的核心目标。

## 遇到的问题

### 1. `summary` 只改了一半

最开始 DTO、前端、service 里已经有 `summary` 相关代码，但 controller 没有真正透传，导致“看起来支持，实际保存不到”。

处理方式：

- controller 补传 `summary`
- service 更新签名
- admin / api-client / tests 一起同步

### 2. 管理页有 handler 没入口

`handleExportUserDocs()` / `handleResetUserDocs()` 已经存在，但页面按钮没有真正渲染出来。

处理方式：

- 在“已入库资料”头部区域补上按钮
- admin 测试补覆盖

### 3. Milvus 测试受本地服务状态影响

处理方式：

- 用 mock error 代替真实端口探测失败
- 把测试从“依赖环境”改成“验证契约”

## 可沉淀为教程/博客的点

- `user_docs` 真源、向量层和展示层为什么容易出现“双轨看似一致、实则不同步”的问题
- 如何用 `summary` / metadata 让 AGUI 卡片展示不退化为“长正文片段”
- 标题型补充资料问题如何通过 catalog probe + `documentIds` 做单文档锚定

## 后续待办

- 在 `#220` 继续推进更高层的向量同步治理：
  - strict / lax sync mode
  - 更完整的运行时同步状态暴露
- 继续完成 M27.1 / M27.2 里剩余的更细粒度补充知识治理与召回质量优化
- 若后续要继续完善 ArticleCard，可再补：
  - admin 手填图片
  - 发布时间
  - 更丰富的媒体预览

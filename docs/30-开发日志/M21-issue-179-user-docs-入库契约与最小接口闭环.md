# M21 / issue-179 开发日志：`user_docs` 入库契约与最小接口闭环（Phase 1 / Step 1~3）

- Issue：`#179`
- 里程碑：`M21 RAG 可解释问答最小闭环（增量）`
- 分支：`fys-dev/feat-m21-issue-179-user-docs-ingestion`
- 日期：`2026-04-22`

## 背景

- `#177` 已完成检索态表与契约骨架（`rag_documents` / `rag_chunks` / `rag_index_runs`）。
- `#178` 已完成 `resume_core` 的 `draft/published` 同步链路。
- 本轮进入 `#179`，先聚焦 `user_docs` 入库最小闭环：先把“文件如何进入检索态”讲清楚，再继续 UI 与后续流程。

## 本次目标

- 先定义并落地 `user_docs` 入库服务契约（输入/输出/metadata）。
- 提供最小后端接口入口（multipart 上传 + scope 校验）。
- 增加最小 e2e 契约测试，验证权限边界与请求合法性。
- 保持“边学边做”节奏：小步可验证、可回滚、可讲解。

## 非目标

- 不改 admin UI。
- 不扩展批量导入、文件管理、删除与重建策略。
- 不在本轮引入异步任务队列或重型向量数据库。
- 不一次性实现 `#179` 全量能力。

## TDD / 测试设计

- Step 1（服务层）：先写 `user-docs-ingestion.service.spec.ts`，固定入库契约与 metadata 断言。
- Step 2（控制器层）：先写 `rag.controller.spec.ts`，验证：
  - 文件存在时调用服务层入库；
  - 缺少文件返回 `400`；
  - 非法 scope 返回 `400`。
- Step 3（最小 e2e）：新增 `ai-rag-user-doc-ingestion.e2e-spec.ts`，验证：
  - admin 可调用入库接口（`201`）；
  - viewer 被拒绝（`403`）；
  - 缺少文件返回 `400`。

## 实际改动

- 新增 `UserDocsIngestionService` 与契约函数：
  - 文件：`apps/server/src/modules/ai/rag/user-docs-ingestion.service.ts`
  - 内容：
    - 入库输入/输出类型；
    - `sourceVersion` 构建规则；
    - 文本切块策略；
    - 入库/运行状态落表流程。
- 调整 `user_docs` 默认切块参数并补注释：
  - `DEFAULT_CHUNK_SIZE = 500`
  - `DEFAULT_CHUNK_OVERLAP = 50`
- 新增控制器入口：
  - 文件：`apps/server/src/modules/ai/rag/rag.controller.ts`
  - 接口：`POST /api/ai/rag/ingest/user-doc`
  - 能力：
    - multipart 上传；
    - `scope` 仅允许 `draft|published`；
    - 参数校验后委托 `UserDocsIngestionService`。
- 新增 Swagger DTO：
  - 文件：`apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`
  - 新增 `RagUserDocIngestBodyDto` / `RagUserDocIngestResultDto`。
- 模块装配：
  - 文件：`apps/server/src/modules/ai/ai.module.ts`
  - 注册 `UserDocsIngestionService` provider。
- 新增测试：
  - `apps/server/src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts`
  - `apps/server/src/modules/ai/rag/__tests__/rag.controller.spec.ts`
  - `apps/server/test/ai-rag-user-doc-ingestion.e2e-spec.ts`

## Review 记录

- 范围控制：本轮仅做后端入库契约与最小接口，不涉及 admin UI。
- 架构取舍：控制器只做边界校验与委托，业务细节集中在 service，便于后续扩展与教学讲解。
- 复用能力：
  - 入库流程复用 `FileExtractionService`、`AiService(embedTexts)` 与 `RagRetrievalRepository`。
  - e2e 通过 `overrideProvider(UserDocsIngestionService)`，把验证焦点收敛在接口契约与鉴权边界。

## 自测结果

- 已通过：
  - `apps/server/node_modules/.bin/tsc --noEmit -p apps/server/tsconfig.build.json`
- 当前环境限制：
  - 无法直接使用 `pnpm`（命令缺失）。
  - `vitest` 在当前环境受 Rollup 可选依赖签名问题影响，未完成本地复跑。

> 建议在本地补跑：
>
> - `pnpm --filter @my-resume/server test -- src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts src/modules/ai/rag/__tests__/rag.controller.spec.ts`
> - `pnpm --filter @my-resume/server test:e2e -- test/ai-rag-user-doc-ingestion.e2e-spec.ts`
> - `pnpm --filter @my-resume/server typecheck`

## 遇到的问题

- 当前终端环境缺少 `pnpm`，测试命令无法直接运行。
- 本地 `vitest` 运行受 Rollup 二进制签名问题影响（`@rollup/rollup-darwin-arm64`）。
- 当前终端无可用 `gh` 命令，无法在此环境直接编辑 GitHub issue 内容。

## Issue checklist 回填（可直接粘贴到 `#179`）

```md
## Phase 1（进行中）：user_docs 入库契约与最小接口

- [x] Step 1：补齐 user_docs 入库服务契约与 metadata 断言测试
- [x] Step 2：新增最小后端入库接口（multipart + scope 校验）
- [x] Step 3：补最小 e2e 契约（admin 201 / viewer 403 / 无文件 400）
- [ ] Step 4：补 admin 侧最小入口（仅触发上传，不扩展管理页）
```

## 可沉淀为教程/博客的点

- 为什么要把“展示态业务表”和“检索态 read model”解耦。
- 如何用 TDD 分三层推进（service → controller → e2e），控制学习节奏。
- 为什么在 e2e 里先 override provider，再逐步放开真实链路。
- `chunk size / overlap` 参数如何在“可解释性”与“召回完整性”之间取平衡。

## 后续待办

- 进入 Phase 1 / Step 4：补 admin 最小上传入口（不做复杂管理界面）。
- 明确 `500/50` 与 `1000/100` 两组参数的对比验证计划（样本、指标、结论模板）。
- 继续保持每一步“先测试设计，再实现”的节奏。

---

## Phase 2 / Step 1（进行中）：切块参数对比实验基线

### 本轮新增

- 在服务层新增切块对比统计能力（不改默认入库参数）：
  - `compareUserDocChunkingStrategies`
  - `summarizeUserDocChunking`
  - `USER_DOC_CHUNKING_STRATEGIES`（`500/50`、`1000/100`）
- 新增策略基线测试（固定“同一文本下两组参数差异”）：
  - `apps/server/src/modules/ai/rag/__tests__/user-doc-chunking-strategy.spec.ts`
- 新增本地实验脚本：
  - `apps/server/scripts/compare-user-doc-chunking.ts`
  - `apps/server/package.json` 新命令：
    - `pnpm --filter @my-resume/server rag:chunk:compare <file...>`

### 建议实验命令

```bash
pnpm --filter @my-resume/server rag:chunk:compare \
  /Users/fri/Desktop/github/AI-Journey-Fighting/drafts/rag-test/xxx.md \
  /Users/fri/Desktop/github/AI-Journey-Fighting/articles/yyy.md
```

> 观察指标：`chunkCount`、`totalChunkChars`、`redundantChars`、`redundancyRatio`。  
> 先用这组“静态切块指标”定基线，再进入后续检索质量对比。

---

## Phase 2 / Step 2（进行中）：检索质量门控（阈值 + 断层）

### 本轮新增

- 新增检索质量门控纯函数模块：
  - `apps/server/src/modules/ai/rag/rag-search-quality.ts`
  - 能力：
    - `resolveRagSearchQualityGate`（从环境变量解析默认门控）
    - `applyRagSearchQualityGate`（对排序结果执行阈值/断层过滤）
- `RagService.search` 接入门控：
  - `apps/server/src/modules/ai/rag/rag.service.ts`
  - 搜索签名新增可选门控参数：`minScore`、`minScoreGap`
- 搜索 API 请求体新增可选门控字段：
  - `apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`
  - `apps/server/src/modules/ai/rag/rag.controller.ts`
- 新增门控单测：
  - `apps/server/src/modules/ai/rag/__tests__/rag-search-quality.spec.ts`

### 本轮目的（和 Milvus 学习内容对齐）

- 先把你在 `milvus-test` 里验证过的“召回后过滤思路”固化在当前 RAG 链路中。
- 这样后续切到 Milvus 作为向量召回层时，门控策略无需重写，可直接复用。

---

## Phase 2 / Step 3（进行中）：Milvus 向量存储适配器骨架（并行可切换）

### 本轮新增

- 新增向量存储抽象契约与统一载荷：
  - `apps/server/src/modules/ai/rag/vector-store/types.ts`
- 新增后端配置解析（默认 `local`，可切 `milvus`）：
  - `apps/server/src/modules/ai/rag/vector-store/config.ts`
  - `apps/server/src/modules/ai/rag/vector-store/tokens.ts`
- 新增适配器工厂与两种实现：
  - `apps/server/src/modules/ai/rag/vector-store/factory.ts`
  - `apps/server/src/modules/ai/rag/vector-store/adapters/local.adapter.ts`（占位 no-op，不改变现有主链路）
  - `apps/server/src/modules/ai/rag/vector-store/adapters/milvus.adapter.ts`（`mock` 模式可回归，`sdk` 模式先 fail-fast 占位）
- 模块注册与注入：
  - `apps/server/src/modules/ai/ai.module.ts` 注入 `RAG_VECTOR_STORE_CONFIG` 与 `RAG_VECTOR_STORE`
  - `apps/server/src/modules/ai/rag/user-docs-ingestion.service.ts` 在写检索态表后并行写入 vector store（先删文档旧向量，再 upsert 新向量）

### 回归测试

- 新增配置/工厂/适配器测试：
  - `apps/server/src/modules/ai/rag/__tests__/vector-store/config.spec.ts`
  - `apps/server/src/modules/ai/rag/__tests__/vector-store/factory.spec.ts`
  - `apps/server/src/modules/ai/rag/__tests__/vector-store/milvus.adapter.spec.ts`
- 更新入库服务测试（断言 vector store 调用）：
  - `apps/server/src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts`

### 本轮结论

- 已实现“并行可切换”骨架：
  - 默认 `local`，当前 RAG 检索主链路不变；
  - 可通过 `RAG_VECTOR_STORE_BACKEND=milvus` 切到 Milvus 适配器骨架；
  - 真实 Milvus SDK 接入留待下一步（当前仅 `mock` 模式）。

### 本轮验证

- 通过：
  - `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts src/modules/ai/rag/__tests__/vector-store/config.spec.ts src/modules/ai/rag/__tests__/vector-store/factory.spec.ts src/modules/ai/rag/__tests__/vector-store/milvus.adapter.spec.ts src/modules/ai/rag/__tests__/rag.controller.spec.ts`
  - `pnpm --filter @my-resume/server typecheck`

---

## Phase 2 / Step 4（进行中）：真实 Milvus SDK 最小闭环（仅向量层）

### 本轮新增

- 引入官方 Milvus Node SDK：
  - `apps/server/package.json` 新增依赖 `@zilliz/milvus2-sdk-node`
- 新增 Milvus SDK client 端口与实现：
  - `apps/server/src/modules/ai/rag/vector-store/milvus-sdk.client.ts`
  - 能力：
    - `ensureCollectionReady`（不存在则建 collection + 向量索引 + load）
    - `upsertChunks`
    - `deleteChunksByDocument`
    - `search`
- `MilvusRagVectorStoreAdapter` 在 `sdk` 模式下从“fail-fast 占位”升级为“委托 SDK client”：
  - `apps/server/src/modules/ai/rag/vector-store/adapters/milvus.adapter.ts`

### 测试与成本控制

- `sdk` 模式测试不连真实 Milvus，使用 client 端口 mock 验证委托调用：
  - `apps/server/src/modules/ai/rag/__tests__/vector-store/milvus.adapter.spec.ts`
- 仍保持“默认 mock 优先”，避免开发与 CI 调用真实 AI/向量服务带来成本：
  - 单测与常规 e2e 使用 mock provider；
  - 真实 Milvus/真实 AI 建议走单独 integration 命令并显式开关。

### 本轮边界

- 仅完成“向量存储层”的真实 SDK 可调用闭环。
- 暂未替换现有 `RagService.search` 主检索链路（仍保持本地索引逻辑），后续按步骤逐步切换。

### Step 4-2：检索灰度路由（向量优先 + 本地回退）

- 新增检索路由配置解析：
  - `apps/server/src/modules/ai/rag/rag-search-routing.ts`
  - 开关：
    - `RAG_SEARCH_USE_VECTOR_STORE`（默认 `false`）
    - `RAG_SEARCH_VECTOR_SCOPE`（默认 `published`）
    - `RAG_SEARCH_VECTOR_FALLBACK_TO_LOCAL`（默认 `true`）
- `RagService.search` 接入灰度策略：
  - `apps/server/src/modules/ai/rag/rag.service.ts`
  - 行为：
    - 开关关闭：完全走本地索引（与历史一致）
    - 开关开启：先走向量 store；命中为空且允许回退时再走本地索引
- 新增/更新测试：
  - `apps/server/src/modules/ai/rag/__tests__/rag-search-routing.spec.ts`
  - `apps/server/src/modules/ai/rag/__tests__/rag.service.spec.ts`

> 这一步的目标是“可灰度验证”，不是“立即替换主检索链路”。

### Step 4-3：本地 Milvus 集成验证脚本（不进 CI）

- 新增本地集成验证脚本：
  - `apps/server/scripts/verify-rag-milvus-integration.ts`
  - 覆盖链路：`upsert -> search -> cleanup(delete)`
- 新增命令：
  - `pnpm --filter @my-resume/server rag:milvus:verify`
- 成本控制：
  - 默认不自动执行；
  - 需显式加开关：
    - `RUN_MILVUS_INTEGRATION=1 pnpm --filter @my-resume/server rag:milvus:verify`
  - 可避免 CI 与日常开发误连真实 Milvus 服务。

### Step 4-4：手动触发 CI 集成验证（workflow_dispatch）

- 新增手动 workflow：
  - `.github/workflows/milvus-integration-verify.yml`
- 流程：
  - 在 GitHub Runner 内启动 `milvus run standalone`
  - 健康检查通过后执行：
    - `pnpm --filter @my-resume/server typecheck`
    - `RUN_MILVUS_INTEGRATION=1 pnpm --filter @my-resume/server rag:milvus:verify`
- 触发方式：
  - GitHub Actions 页面手动运行（`workflow_dispatch`）
  - 默认不加入常规 CI 主链路，避免增加日常流水线耗时与外部服务依赖。

### Step 4-5：请求级检索路由开关（便于 A/B 学习实验）

- 新增请求级路由覆盖能力：
  - `apps/server/src/modules/ai/rag/rag-search-routing.ts`
  - 在环境级默认配置上，支持按请求覆盖：
    - `useVectorStore`
    - `vectorScope`
    - `fallbackToLocal`
- `search` 接口新增实验参数（可选）：
  - `apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`
  - `apps/server/src/modules/ai/rag/rag.controller.ts`
- `RagService.search` 接入路由覆盖：
  - `apps/server/src/modules/ai/rag/rag.service.ts`
  - 保持默认行为不变（不开开关仍走本地）

### Step 4-5 验证

- 测试通过：
  - `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/rag-search-routing.spec.ts src/modules/ai/rag/__tests__/rag.service.spec.ts src/modules/ai/rag/__tests__/rag.controller.spec.ts`
  - `pnpm --filter @my-resume/server typecheck`

### Step 4-6：`ask` 接口支持请求级路由覆盖（与 `search` 对齐）

- 目标：
  - 让问答入口也能在单次请求中切换 `local/milvus` 路由，便于学习实验与对比，不改默认环境行为。
- 实现：
  - `apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`
    - `RagAskBodyDto` 新增可选字段：
      - `useVectorStore`
      - `vectorScope`
      - `vectorFallbackToLocal`
  - `apps/server/src/modules/ai/rag/rag.controller.ts`
    - `ask` 入参校验 `vectorScope`（仅允许 `draft|published|all`）
    - 将请求级路由覆盖参数透传给 `RagService.ask`
  - `apps/server/src/modules/ai/rag/rag.service.ts`
    - `ask` 方法新增 `routingOverride` 参数，并透传至 `search`
- 测试：
  - `apps/server/src/modules/ai/rag/__tests__/rag.controller.spec.ts`
    - 断言 `ask` 会把路由覆盖参数传递给 service
    - 断言非法 `vectorScope` 返回 `BadRequestException`
  - `apps/server/src/modules/ai/rag/__tests__/rag.service.spec.ts`
    - 断言 `ask -> search` 的路由透传行为

### Step 4-6 验证

- 测试通过：
  - `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/rag-search-routing.spec.ts src/modules/ai/rag/__tests__/rag.service.spec.ts src/modules/ai/rag/__tests__/rag.controller.spec.ts`
  - `pnpm --filter @my-resume/server typecheck`

### Step 4-7：user_docs 切片 profile 化（为知识库策略实验准备）

- 目标：
  - 保留默认 `500/50` 行为不变；
  - 同时支持按请求选择更大上下文切片，便于后续知识库实验。
- 新增：
  - `apps/server/src/modules/ai/rag/user-doc-chunking.ts`
    - 新增 `UserDocChunkingProfile = 'balanced' | 'contextual'`
    - 新增 `resolveUserDocChunkingStrategy(profile)`：
      - `balanced => 500/50`
      - `contextual => 1000/100`
  - `apps/server/src/modules/ai/rag/user-docs-ingestion.service.ts`
    - 入库参数新增 `chunkingProfile`（可选）
    - 入库结果新增 `chunkingProfile/chunkSize/chunkOverlap`
    - 文档/切块/vector metadata 写入切片配置，保证可追溯
  - `apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`
    - `RagUserDocIngestBodyDto` 新增 `chunkingProfile`
    - `RagUserDocIngestResultDto` 新增切片配置字段
  - `apps/server/src/modules/ai/rag/rag.controller.ts`
    - 增加 `chunkingProfile` 入参校验与透传
- 测试：
  - `apps/server/src/modules/ai/rag/__tests__/user-doc-chunking-strategy.spec.ts`
    - 覆盖 profile 解析与默认策略
  - `apps/server/src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts`
    - 覆盖默认 profile metadata 与 contextual 切片计数
  - `apps/server/src/modules/ai/rag/__tests__/rag.controller.spec.ts`
    - 覆盖 `chunkingProfile` 透传与非法值拒绝

### Step 4-7 验证

- 测试通过：
  - `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/user-doc-chunking-strategy.spec.ts src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts src/modules/ai/rag/__tests__/rag.controller.spec.ts`
  - `pnpm --filter @my-resume/server typecheck`

### Step 4-8：低成本检索对比脚本（按 profile 看命中差异）

- 目标：
  - 不调用真实 AI，不增加成本；
  - 先用关键词检索基线对比 `balanced/contextual` 两种切片配置的命中趋势。
- 新增：
  - `apps/server/src/modules/ai/rag/user-doc-retrieval-evaluator.ts`
    - `calculateKeywordScore`
    - `rankUserDocChunksByKeywordQuery`
    - `evaluateUserDocRetrievalByProfiles`
  - `apps/server/scripts/compare-user-doc-retrieval.ts`
    - 新命令：`pnpm --filter @my-resume/server rag:retrieval:compare "<query>" <file1> [file2 ...]`
    - 输出字段：`profile/chunkCount/hitChunkCount/topScore/avgTopScore/topChunk`
  - `apps/server/package.json`
    - 注册 `rag:retrieval:compare` 脚本
- 测试：
  - 新增 `apps/server/src/modules/ai/rag/__tests__/user-doc-retrieval-evaluator.spec.ts`
  - 覆盖：
    - 命中排序正确性
    - profile 对比（`balanced` chunk 更多）
    - 空/未命中 query 的零分行为

### Step 4-8 验证

- 测试通过：
  - `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/user-doc-retrieval-evaluator.spec.ts src/modules/ai/rag/__tests__/user-doc-chunking-strategy.spec.ts src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts`
  - `pnpm --filter @my-resume/server typecheck`
- 脚本手工验证通过：
  - `pnpm --filter @my-resume/server rag:retrieval:compare "Milvus 检索" /Users/fri/Desktop/personal/my-resume/docs/30-开发日志/M21-issue-179-user-docs-入库契约与最小接口闭环.md`

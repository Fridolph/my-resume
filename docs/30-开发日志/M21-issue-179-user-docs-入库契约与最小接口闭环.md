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

# M21 / issue-178 开发日志：简历源同步链路（draft/published 版本化索引）

## 背景

- `#177` 已完成检索态表与契约骨架（`rag_documents` / `rag_chunks` / `rag_index_runs`）。
- 进入 `#178` 后，核心问题转为：简历草稿/发布发生变化时，如何让检索态按版本同步，避免命中旧内容。

## 本次目标

- 建立 `draft/published` 的最小同步触发链路。
- 固定 `sourceVersion` 规则（字符串版本键）。
- 让同步过程具备最小状态可观测能力（`pending/succeeded/failed`）。
- 提供人工重建入口，便于失败后重试。

## 实际改动

- 新增 `ResumeRagSyncService`：
  - 文件：`apps/server/src/modules/resume/resume-rag-sync.service.ts`
  - 负责：
    - `sourceVersion` 规则生成：
      - `draft:<updatedAt_ms>`
      - `published:<publishedAt_ms>`
    - 将简历按 locale 渲染为 markdown 并写入检索态文档/chunk。
    - 写入并流转 `rag_index_runs` 状态。
    - 支持按 `draft/published/all` 人工触发同步。
- 扩展 `RagRetrievalRepository`：
  - 文件：`apps/server/src/modules/ai/rag/rag-retrieval.repository.ts`
  - 新增 `updateIndexRunStatus`，用于 `pending -> succeeded/failed` 状态收敛。
- 接入业务触发点：
  - 文件：`apps/server/src/modules/resume/resume-publication.service.ts`
  - 在 `updateDraft` 与 `publish` 后触发检索态同步。
  - 同步失败不阻断简历主链路（错误可观测、可重试）。
- 新增人工触发接口：
  - 文件：`apps/server/src/modules/ai/rag/rag.controller.ts`
  - `POST /api/ai/rag/sync/resume`
  - 支持 `scope=draft|published|all`。
- 更新 Swagger DTO：
  - 文件：`apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`
  - 补充手工同步请求/响应模型。
- 模块装配：
  - 文件：`apps/server/src/modules/resume/resume.module.ts`
  - 注册并导出 `ResumeRagSyncService`。
- 新增单测：
  - 文件：`apps/server/src/modules/resume/__tests__/resume-rag-sync.service.spec.ts`
  - 覆盖：
    - `sourceVersion` 规则
    - 成功同步路径
    - 失败状态回写路径
    - `syncCurrent(all)` 路径

## Review 记录

- 范围控制：本轮仅覆盖 `resume_core` 的 `draft/published` 同步，不扩展 `user_docs`。
- 设计取舍：
  - 先保证“版本一致性 + 可观测 + 可重试”，暂不引入复杂任务队列。
  - 同步失败不阻断主业务保存/发布，避免编辑链路可用性受影响。

## 遇到的问题

- 本地 agent 环境缺少 `pnpm`，无法在当前终端直接复跑 server 测试。

## 测试与验证

- 已新增 `ResumeRagSyncService` 单测文件与断言。
- 待本地执行（或 CI 验证）：
  - `pnpm --filter @my-resume/server test -- src/modules/resume/__tests__/resume-rag-sync.service.spec.ts`
  - `pnpm --filter @my-resume/server test:e2e`
  - `pnpm --filter @my-resume/server typecheck`

## 后续可写成教程/博客的切入点

- 为什么 `sourceVersion` 要显式化，而不是依赖“最新一条”隐式语义。
- 为什么检索态同步失败不直接阻断编辑主链路。
- 如何用最小状态机（`pending/succeeded/failed`）建立可观测与可重试能力。

---

## Follow-up（本分支补充）：API Server 渐进 DDD 分层重组（第一/二批）

### 背景

- 在 `#178` 基础功能可用后，`apps/server/src/modules` 的目录组织仍偏“历史混排”。
- 为保证后续教学节奏与可维护性，本分支补了一轮“**不改业务行为**”的渐进式分层重组。

### 本轮目标

- 保持现有接口行为与测试契约不变。
- 先把 `ai`、`auth`、`resume` 三个核心模块切到统一分层目录：
  - `domain/`
  - `application/services/`
  - `infrastructure/repositories/`（按需）
  - `transport/controllers/` + `transport/dto|types`
- 保留旧路径兼容导出（`re-export`），避免一次性破坏现有引用。

### 实际改动

- `ai` 模块完成第一批分层重组（含 `README` 与兼容层）：
  - 新增：
    - `apps/server/src/modules/ai/application/services/*`
    - `apps/server/src/modules/ai/domain/ports/*`
    - `apps/server/src/modules/ai/infrastructure/{config,providers,repositories}/*`
    - `apps/server/src/modules/ai/transport/{controllers,dto}/*`
  - `apps/server/src/modules/ai/ai.module.ts` 改为装配新分层实现。
  - 根目录旧文件改为 `export * from ...` 兼容导出。

- `auth` 模块完成第二批分层重组（含 `README` 与兼容层）：
  - 新增：
    - `apps/server/src/modules/auth/application/services/auth.service.ts`
    - `apps/server/src/modules/auth/transport/controllers/{auth.controller.ts,auth-demo.controller.ts}`
  - `apps/server/src/modules/auth/auth.module.ts` 改为装配新路径。
  - 旧路径 `auth.service.ts` / `auth.controller.ts` / `auth-demo.controller.ts` 改为兼容导出。

- `resume` 模块完成第二批核心重组（含 `README` 更新与兼容层）：
  - 新增：
    - `apps/server/src/modules/resume/application/services/*`
    - `apps/server/src/modules/resume/infrastructure/repositories/resume-publication.repository.ts`
    - `apps/server/src/modules/resume/transport/controllers/resume.controller.ts`
  - `apps/server/src/modules/resume/resume.module.ts` 改为装配新路径。
  - 旧路径核心文件改为兼容导出。

- 工具与流程文档同步：
  - `apps/server/scripts/scaffold-module.mjs`：脚手架目录补齐到分层子目录。
  - `apps/server/README.md` 与 `docs/20-研发流程/01-GitHub-标准开发流程.md` 同步脚手架规范。
  - 新增 `apps/server/src/modules/README.md` 作为 server 模块级架构约定。

### Review 记录

- 本轮严格限定在目录分层与 import 装配调整，不改业务流程与接口行为。
- 采用“先迁移、后兼容、再渐进清理”的迁移策略，确保可回滚、可教学。

### 测试与验证

- 已执行：
  - `apps/server/node_modules/.bin/tsc --noEmit -p apps/server/tsconfig.build.json`（通过）
- 当前环境限制：
  - `vitest` 受本地 Rollup 可选依赖签名问题影响，未在该环境完成全量单测复跑。

### 后续建议

- 后续 Issue 可继续逐步移除 `re-export` 兼容层，最终收敛到分层目录唯一入口。
- 新增模块统一走：
  - `pnpm --filter @my-resume/server scaffold:module -- <module-name>`

## Issue 验收映射（关闭前核对）

- [x] 建立 `draft/published` 与知识索引的同步触发点  
  - `updateDraft` 触发：`apps/server/src/modules/resume/application/services/resume-publication.service.ts`
  - `publish` 触发：`apps/server/src/modules/resume/application/services/resume-publication.service.ts`
- [x] 设计 `resumeVersion/sourceVersion` 对齐策略  
  - `draft:<updatedAt_ms>` / `published:<publishedAt_ms>`：`apps/server/src/modules/resume/application/services/resume-rag-sync.service.ts`
- [x] 最小可回滚的重建/增量同步流程  
  - `syncCurrent(draft|published|all)`：`apps/server/src/modules/resume/application/services/resume-rag-sync.service.ts`
- [x] 索引状态可观测（`pending/succeeded/failed`）  
  - 契约与表结构：`apps/server/src/database/schema.ts`
  - 状态写回：`apps/server/src/modules/ai/rag/rag-retrieval.repository.ts`
- [x] 异常重试与人工重建入口  
  - `POST /api/ai/rag/sync/resume`：`apps/server/src/modules/ai/rag/rag.controller.ts`
- [x] 测试补充  
  - 同步链路与状态流转：`apps/server/src/modules/resume/__tests__/resume-rag-sync.service.spec.ts`
  - 版本契约：`apps/server/src/modules/ai/rag/__tests__/rag.types.spec.ts`

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

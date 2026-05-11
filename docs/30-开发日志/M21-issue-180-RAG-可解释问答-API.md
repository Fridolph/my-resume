# M21 / Issue 180 - RAG 可解释问答 API

- Issue：`#180`
- 里程碑：`M21 RAG 入库与可解释问答`
- 分支：`fys-dev/feat-m21-issue-180-rag-citations-api`
- 日期：`2026-05-11`

## 背景

#179 已完成 user_docs 上传入库与统一 chunk metadata，RAG 进入“能检索”的阶段。#180 的重点不是让模型自由回答，而是让问答结果可解释、可追溯、可审计：回答必须带引用；检索不到上下文时必须明确“不足”，不能让模型凭空编造。

## 本次目标

- 保留现有非流式 `/api/ai/rag/ask` 问答入口。
- 为问答结果增加强制 `citations[]` 契约。
- 无检索命中时直接返回信息不足说明，并跳过 provider 生成调用。
- 问答上下文按 `resume_core > user_docs` 排序，优先引用简历核心事实。
- 在 API Client 中补充 `createAskRagMethod` 和对应类型。
- 增加基础调用日志，记录问题、命中来源、耗时、状态。

## 非目标

- 不实现流式 Chat。
- 不实现 Agent 工具调用。
- 不做复杂会话记忆编排。
- 不新增数据库表或 usage record 持久化。
- 不进入前端引用卡片 UI，本轮只收口 API 与 client 契约。

## 实际改动

- `RagService.ask`：
  - 检索后构造 `citations[]`，包含 `ref/id/title/section/sourceType/sourcePath/score/snippet`。
  - 将历史来源 `resume/knowledge` 统一映射到 `resume_core/user_docs`。
  - 按 `resume_core > user_docs` 排序后再拼接上下文，确保核心简历事实优先进入回答。
  - 检索为空时返回“检索到的上下文不足”，不调用 `generateText`。
  - 使用 Nest `Logger` 输出 `rag.ask.completed`，记录 `answered/insufficient_context`、命中数量、引用数量、来源摘要、耗时和 provider/model。
- `rag.types.ts`：新增 `RagAskCitation` 与 `RagAskResult`。
- `rag-swagger.dto.ts`：新增 `RagAskCitationDto`，并在 `RagAskResultDto` 中公开 `citations[]`。
- `rag-ask.prompt.ts`：强化 prompt，要求回答中使用 `[#n]` 标注支撑片段。
- `packages/api-client`：新增 `AskRagInput`、`RagAskResult`、`RagAskCitation`、`RagSearchMatch` 等类型，以及 `createAskRagMethod`。
- 测试补充：覆盖有引用回答、无引用不足回答、source priority、API client 请求体和返回 citations。

## Review 记录

- 范围控制：本轮只做 #180 非流式 API 契约，不做 #182 SSE 流式协议，不做 #184 Web Chat UI。
- 引用策略：第一版 citations 由服务端根据检索命中确定，而不是要求模型输出结构化 citations，避免模型漏引导致 wire shape 不稳定。
- 不足回答策略：无命中时不进入模型，直接返回可预测文案，降低幻觉风险与不必要调用成本。
- 来源优先级：排序只影响 ask 上下文与 citations，不修改底层 search 的原始检索能力。

## 测试与验证

已执行：

```bash
pnpm --dir apps/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/rag.service.spec.ts src/modules/ai/rag/__tests__/rag.controller.spec.ts src/modules/ai/rag/prompts/__tests__/rag-ask.prompt.spec.ts
pnpm --filter @my-resume/api-client test -- src/ai.spec.ts
pnpm --filter @my-resume/server typecheck
pnpm --filter @my-resume/api-client typecheck
```

结果：

- Server targeted tests：3 files / 24 tests passed。
- API Client tests：3 files / 27 tests passed。
- Server typecheck：passed。
- API Client typecheck：passed。

注意：`pnpm --filter @my-resume/server test -- ...` 当前会在本地 Vitest 配置下扩展运行 server 全量 suite；在 Codex sandbox 中，`api-response-envelope.spec.ts` 的 supertest 监听会触发 `listen EPERM: operation not permitted 0.0.0.0`。本轮使用 `pnpm --dir apps/server exec vitest run --config ...` 精确验证目标文件，避免把 sandbox 端口限制误判为 RAG 改动失败。

## 后续可写成教程/博客的点

- 为什么 RAG 回答必须把 `answer` 和 `citations` 拆开管理。
- “检索不到就不生成”如何降低幻觉和调用成本。
- citations 第一版为什么由服务端根据检索命中生成，而不是交给模型自由输出。
- `resume_core > user_docs` 的来源优先级如何影响可解释问答。

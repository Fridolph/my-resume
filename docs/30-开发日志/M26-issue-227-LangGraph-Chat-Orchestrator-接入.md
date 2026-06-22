# M26 / #227 LangGraph Chat Orchestrator 接入

## 背景

上一轮 #226 已经为 RAG chunk 补齐了 `knowledgeDomain / contentType / sourceCollection / renderHint` 等 metadata。随着 Web AI Chat 继续向多域 RAG 与 AGUI 展示演进，原本 `AiChatService.generateAnswer()` 同时承担问题分类、RAG 检索、越界判断、回答生成和卡片构建，职责开始偏重。

本次 #227 的目标是先引入一个可替换的 Chat 编排层，让业务会话逻辑与回答生成流程分开，为后续 LangGraph 节点化、路由增强和多域检索打基础。

## 本次目标

- 新增 `AiChatGraphService` 作为等价 Orchestrator。
- 初步落地 `input_normalize -> intent_and_domain_route -> boundary_guard -> retrieve -> answer_compose` 流程。
- `AiChatService` 继续负责 session、SSE callback、消息持久化和第 10/20 轮总结。
- Graph 主路径异常时保留旧 `generateAnswer()` 链路作为 fallback。
- 不引入真实 LangGraph 依赖，避免在当前 issue 中扩展依赖面。

## 非目标

- 不迁移会话持久化职责。
- 不改 SSE event wire shape。
- 不新增数据库表或环境变量。
- 不实现 #228 之后的复杂 AGUI 卡片策略或多表检索细化。

## 实际改动

- 新增 `apps/server/src/modules/ai/chat/ai-chat-graph.service.ts`。
  - 规则归一用户输入。
  - 基于关键词进行 intent/domain route。
  - 对天气、股票、政治、医疗、法律等明显越界问题在检索前拒答。
  - 调用 `RagService.ask()` 时传入 `vectorScope: 'published'` 和可选 `knowledgeDomains`。
  - 复用已发布简历摘要作为 RAG 不足或检索失败时的兜底上下文。
  - 根据 citation metadata 构建项目、工作经历、文章、媒体、兴趣等 answer blocks。
- 在 `AiModule` 注册 `AiChatGraphService`。
- 在 `AiChatService.createAssistantReply()` 中改为优先调用 graph 编排层。
- 保留旧 `generateAnswer()`，并通过 `generateAnswerWithGraph()` 作为 fallback 安全网。
- 补充 `ai-chat-graph.service.spec.ts` 与 service fallback 测试。

## Review 记录

- 改动范围保持在 `apps/server/src/modules/ai/chat/`、`apps/server/src/modules/ai/ai.module.ts` 和开发日志内。
- 没有引入新 npm 依赖。
- 没有改数据库 schema、环境变量、Docker 或发布脚本。
- 旧 SSE 顺序测试保持通过，说明前端消费契约未被破坏。
- 旧 `AiChatService.generateAnswer()` 暂时保留，后续可以在 graph 稳定后再考虑去重。

## 测试与验证

- `pnpm --filter @my-resume/server test -- src/modules/ai/chat/__tests__/ai-chat.service.spec.ts src/modules/ai/chat/__tests__/ai-chat.controller.spec.ts src/modules/ai/chat/__tests__/ai-chat-graph.service.spec.ts`
  - 结果：通过。当前 vitest 配置实际收集并跑过 61 个 server 测试文件，共 253 个测试。
- `pnpm --filter @my-resume/server typecheck`
  - 结果：通过。

## 后续衔接

- #228 可继续基于 `AiChatGraphService` 扩展 answer block 策略，避免把展示决策塞回 `AiChatService`。
- #229/#230 可继续把 domain route 从关键词规则升级为更明确的 router 节点，并接入更多资料域。
- 若后续真的引入 LangGraph 包，应优先替换 `AiChatGraphService` 内部节点实现，而不是改动会话持久化层。

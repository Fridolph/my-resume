# M26 / #228 基础简历上下文与分域检索合并策略

## 背景

#227 已经把 Web AI Chat 的回答生成拆到了 `AiChatGraphService`，但 graph 层传给 RAG 的领域仍是裸路由结果。虽然 RAG 层内部已有 normalize 逻辑会把 `resume_core` 合入目标域，但从 graph 编排视角看，基础简历上下文并不显式，后续排查与演进不够直观。

本次 #228 要把“我是谁”的基础简历上下文固定为所有检索的底座，再按问题追加项目、兴趣、创作等目标域。

## 本次目标

- Graph retrieval 节点显式使用 `resume_core + routed domains`。
- 项目类问题检索 `resume_core + projects`。
- 兴趣类问题检索 `resume_core + hobbies`。
- 创作类问题检索 `resume_core + writing_media`。
- 保留 citation 中的 `knowledgeDomain` 与 `score`，方便前端 tooltip 和后续观测解释。
- 对低相关 citation 分数增加保护，避免弱命中直接生成确定性回答。

## 非目标

- 不改引用展示协议。
- 不做复杂 rerank 或 query rewrite。
- 不扩展 Admin 报表。
- 不新增数据库、环境变量或依赖。

## 实际改动

- 在 `AiChatGraphService` 中新增 `mergeResumeCoreKnowledgeDomains()`。
- `retrieve()` 调用 `RagService.ask()` 时显式传入合并后的 `knowledgeDomains`。
- `GraphRetrievalResult` 记录本次实际检索域，日志中输出 `retrievalKnowledgeDomains`。
- `composeAnswer()` 对 citation top score `< 0.1` 的结果返回低相关/拒答类回复。
- 扩展 `ai-chat-graph.service.spec.ts`：
  - 兴趣问题断言 `resume_core + hobbies`。
  - 项目问题断言 `resume_core + projects`，并保留 citation domain/score。
  - 创作问题断言 `resume_core + writing_media`，并生成 article card。
  - 低相关 citation 触发保护回答。

## Review 记录

- 改动只集中在 graph service 和 graph service 测试。
- 复用 #227 已有编排层，没有改 `AiChatService` 会话/SSE/持久化职责。
- 未引入新的 RAG 协议字段，仍使用现有 `knowledgeDomain / score / renderHint`。
- 低相关保护只在 graph compose 层兜底，不改变 RAG search 的全局阈值。

## 测试与验证

- `pnpm --filter @my-resume/server test -- src/modules/ai/chat/__tests__/ai-chat-graph.service.spec.ts src/modules/ai/chat/__tests__/ai-chat.service.spec.ts src/modules/ai/chat/__tests__/ai-chat.controller.spec.ts`
  - 结果：通过。当前配置实际跑过 61 个 server 测试文件，共 256 个测试。
- `pnpm --filter @my-resume/server typecheck`
  - 结果：通过。
- targeted oxlint touched files
  - 结果：0 warning / 0 error。
- `git diff --check`
  - 结果：通过。

## 后续衔接

- #229 可以继续利用 citation metadata 与 `renderHint` 做更明确的富展示实体模型。
- #230 可以基于 `retrievalKnowledgeDomains` 和 citation domain/score 增加可观测日志与固定评测样例。

# M26 / #230 多域 RAG 可观测日志与评测样例

## 背景

#227 已经把 AI Chat 回答链路收束到 graph 编排，#228 让回答始终合并基础简历上下文和多域 RAG，#229 则补齐了面向 AGUI / Card 展示的 rich metadata。当前缺口是：当回答质量不稳定时，我们只能从最终文本倒推问题，缺少对「路由到了哪些知识域、召回到了什么、是否命中富展示、为什么 fallback」的轻量可观测信息。

## 本次目标

- 在 `AiChatGraphService` 中记录多域 RAG 路由与召回摘要。
- 日志展示 knowledge domains、命中数量、top citations、score、richCard 命中情况和 fallback reason。
- 为项目、兴趣、创作、越界问题建立最小评测样例，作为后续多域 RAG 质量回归的种子集合。
- 保持实现轻量，不引入评测平台、日志仓库或 Admin 大盘。

## 非目标

- 不新增数据库表。
- 不新增环境变量。
- 不接入复杂 eval runner。
- 不改 SSE / API wire shape。
- 不记录完整 RAG 上下文或大段原文。
- 不改前端 Chat UI。

## 实际改动

- `apps/server/src/modules/ai/chat/ai-chat-graph.service.ts`
  - 新增 citation 日志摘要 helper，只记录 `ref/title/sourceType/score/knowledgeDomain/contentType/renderHint/hasRichCard` 和截断后的 `snippet`。
  - 新增 answer block 摘要 helper，记录 block type 与可读标题。
  - 在 `retrieve()` 成功后记录 `ai-chat.graph.retrieval_completed`：包含分类、意图、知识域、match/citation 数量、top 3 citation 摘要、fallback reason 与耗时。
  - 在 `answer_compose` 节点日志中追加 `blockTypes`，方便观察是否真的生成了 `project_card / hobby_card / article_card`。
  - 在 `resume_fallback` 日志中追加 `blockCount / blockTypes`，方便区分「无召回但可基于简历摘要回答」与「完全越界/低相关」。
- `apps/server/src/modules/ai/chat/evaluation/ai-chat-rag-eval.fixtures.ts`
  - 新增四条最小评测样例：项目、兴趣、创作、越界。
  - 每条样例明确期望 intent、knowledge domains、block types 与 citation content types。
- `apps/server/src/modules/ai/chat/__tests__/ai-chat-graph.service.spec.ts`
  - 覆盖 retrieval log 中的知识域、top citation、score、richCard 命中与 snippet 截断。
  - 覆盖 answer compose / resume fallback 的 block 摘要日志。
- `apps/server/src/modules/ai/chat/__tests__/ai-chat-rag-eval.fixtures.spec.ts`
  - 固化当前 M26 第一版评测样例集合，防止后续误删关键场景。

## Review 记录

- 改动集中在 #230 的 server chat graph 可观测性和 fixtures。
- 没有新增依赖、数据库、环境变量或 Admin 页面。
- 日志只保留短摘要，不写入 API key、headers、完整检索上下文或长文本。
- fixture 目前只作为静态样例，不主动执行真实 AI 调用，避免把测试稳定性绑定到外部模型。
- 当前日志用于本地排障和后续质量分析；若未来要做长期指标，应另开 issue 设计采样、脱敏和存储策略。

## 测试与验证

- `pnpm --filter @my-resume/server test -- src/modules/ai/chat/__tests__/ai-chat-graph.service.spec.ts src/modules/ai/chat/__tests__/ai-chat-rag-eval.fixtures.spec.ts`
  - 结果：通过。当前 server 配置实际跑过 62 个测试文件，共 261 个测试。

## 后续衔接

- 后续可在不改变本轮轻量 fixture 的前提下，增加一个离线 eval runner，用固定 mock 检索结果验证路由、召回域和 card 类型。
- 若 M27 / AI Intro 需要技能拼图或问答解锁机制，可以复用这些样例作为「问题类型 -> 期望展示实体」的起点。
- 如果生产环境需要持久化可观测日志，应先设计脱敏、采样、保留周期和 Admin 权限边界。

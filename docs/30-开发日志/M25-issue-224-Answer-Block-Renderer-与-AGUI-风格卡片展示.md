# M25 / issue #224：Answer Block Renderer 与 AGUI 风格卡片展示

## 背景

AI Chat 的 server / api-client 已经具备 `answerBlocks` 数据结构，但 Web 端之前主要展示纯文本和 citation tooltip。为了支撑后续 AI Intro 与多域 RAG 的 AGUI 风格表达，需要先把结构化回答渲染层抽出来。

## 本次目标

- 新增统一 `AiChatAnswerBlockRenderer`。
- 支持项目、经历、兴趣、文章、媒体、总结、系统提示和文本 block。
- 接入现有 AI Chat 消息列表。
- 保留 citation tooltip，不把普通检索来源自动渲染成来源卡片。

## 非目标

- 不修改 SSE 协议。
- 不修改服务端 RAG / Chat 生成逻辑。
- 不做 AGUI 标准全量兼容。
- 不把 citation 末尾引用列表恢复成大块来源卡片。

## 实际改动

- 新增 `apps/web/app/_shared/ai-chat/ai-chat-answer-block-renderer.tsx`。
- 新增 `apps/web/app/_shared/ai-chat/types/ai-chat-answer-block-renderer.types.ts`，按 TSX 类型拆分约束抽离 renderer props。
- `AiChatMessageList` 在 assistant 消息存在 `answerBlocks` 时渲染结构化卡片。
- 保持 citation chip / tooltip 独立展示，普通 citation 不会自动变成卡片。
- 新增 renderer 专项测试，覆盖 project / experience / hobby / article / media / summary / system_notice / empty fallback。
- 调整 drawer 测试，明确“无 answerBlocks 时不展示 citation 来源卡片”的边界。

## Review 记录

- Renderer 放在 `_shared/ai-chat`，后续 Quick Ask / AI Intro 都可以复用，不绑定 Drawer。
- 链接按钮使用原生 `a`，避免 HeroUI Button 不支持 `as` 属性导致类型风险。
- 当前卡片视觉保持轻量，避免和 citation tooltip 的来源解释混淆。

## 测试与验证

- `pnpm --dir apps/web exec vitest run 'app/_shared/ai-chat/__tests__/ai-chat-answer-block-renderer.spec.tsx' 'app/_shared/ai-chat/__tests__/ai-chat-drawer.spec.tsx'`
- `pnpm --filter @my-resume/web typecheck`
- `git diff --check`

以上均通过。

## 遗留风险与后续

- 当前只是渲染层，真实 block 质量仍取决于 M26 的 LangGraph 多域路由与结构化生成。
- AI Intro 后续若接入真实问答，可直接复用该 renderer 展示 answer blocks。

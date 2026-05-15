# M23 / #182-#186 Web 全局 AI Chat Drawer 与公开站 MVP 闭环

## 背景

- 公开站原有 `ai-talk` 仍是信息架构占位页，真实问答链路尚未落地。
- 本轮目标不是继续扩充说明页，而是把公开站 AI 能力改造成一个真实可交互、可治理、可回看的最小闭环。
- 同时沿用现有 RAG 检索与 AI provider 能力，避免为了新入口再造第二套问答基础设施。

## 本次目标

- 在 web 公开站落地全局 AI Chat Drawer，并允许跨页面访问。
- 先以 MVP 形式打通公开站主链路：点击头像 -> 访客提示 Modal -> 同意后直接进入全局 Drawer -> 多轮问答 -> 会话结束后最小化回看。
- 保留底层 `lead / useKey / session` 模型，作为后续治理台和更严格准入策略的基础，但不把它暴露成当前公开站首屏门槛。
- 会话规则固定为：按用户提问次数计数，第 10 次压缩总结，第 20 次结束并生成最终总结。
- Admin 端新增最小治理台，支持查看线索、发放/作废 useKey、查看会话详情。

## 实际改动

### 1. API Client

- 在 `packages/api-client` 新增公开站 AI Chat 契约：
  - 访客确认提示后直接认领当日公开会话
  - 拉取会话
  - 关闭会话
  - 流式发送消息
  - 保留 Admin 查询线索 / useKey / 会话与详情能力
- 新增 AI Chat 相关类型：会话、消息、answer blocks、summary、SSE 事件等。
- 为 AI Chat SSE 新增 `streamAiChatMessage`，沿用已有 `fetch + ReadableStream` 模式。

### 2. Server 侧 Chat 域

- 在 `apps/server/src/modules/ai/chat/` 下新增 AI Chat 领域：
  - `AiChatRepository`
  - `AiChatService`
  - `AiChatBootstrapService`
  - summary prompt builder
- 在数据库 schema 中新增：
  - `ai_chat_visitor_leads`
  - `ai_chat_usekeys`
  - `ai_chat_sessions`
  - `ai_chat_messages`
- 通过 `AiChatBootstrapService` 在启动时补齐表结构，避免旧 SQLite 库直接缺表。
- 新增公开接口与 Admin 接口：
  - `POST /api/ai/chat/public/claim`
  - `POST /api/ai/chat/leads`
  - `POST /api/ai/chat/usekey/claim`
  - `GET /api/ai/chat/sessions/:sessionId`
  - `POST /api/ai/chat/sessions/:sessionId/messages`（SSE）
  - `POST /api/ai/chat/sessions/:sessionId/close`
  - `GET /api/ai/chat/admin/leads`
  - `POST /api/ai/chat/admin/usekeys`
  - `POST /api/ai/chat/admin/usekeys/:useKey/revoke`
  - `GET /api/ai/chat/admin/usekeys`
  - `GET /api/ai/chat/admin/sessions`
  - `GET /api/ai/chat/admin/sessions/:sessionId`
- 回答生成策略：
  - 继续复用 `RagService.ask()` 做公开站问答与 citations。
  - 若无可靠检索上下文，直接拒答。
  - 命中 `project / experience` 时，根据已发布简历快照组装 `project_card / experience_card` answer blocks。
- 总结策略：
  - 第 10 / 20 次提问后调用结构化 summary prompt，沉淀 summary 与 keywords。
  - 同时把 summary 作为系统消息落入消息流，便于 web/admin 统一展示。
- 公开站 MVP 准入策略：
  - 访客同意提示后，以 `IP + 当天日期` 生成公开来源键。
  - 同一 IP 当天复用同一条 lead / useKey / session，不额外暴露输入 useKey 的步骤。
  - 每个 IP 每天最多 20 次提问，关闭会话后仍可通过最小化入口回看。
- 启动兼容修复：
  - 历史本地 SQLite 可能缺少 `source_key` 等新列。
  - 本轮把 `ai_chat_visitor_leads` 的补列逻辑提前到建索引之前，避免旧库在模块启动时直接崩溃。

### 3. Web 公开站

- 在 `WebLocaleProviders` 中挂载 `AiChatProvider`，让 AI Chat Drawer 成为站点级能力。
- 在站点头像交互区挂载“talk with me ...”入口，点击头像即触发 AI Chat 主流程。
- 新增公开站 AI Chat 全局状态与 Drawer：
  - `consent`：先展示隐私 / IP 记录提示 Modal
  - `chat`：多轮会话
  - `closed`：会话结束态与总结展示
- 使用 localStorage 保存 `sessionId + useKey + consentDay`，刷新或跨页面后自动恢复会话。
- 消息流使用 SSE 实时消费 `start / token / citation / block / summary / done / error`。
- Drawer 关闭后不彻底销毁，而是缩成右下角悬浮 Dock；再次点击可恢复完整对话窗。

### 4. Admin 治理台

- 新增 `dashboard/ai/chat-governance` 页面。
- 在 AI 工作台模块卡片中增加“AI Chat 治理台”入口。
- 首版治理台支持：
  - 线索列表
  - 发放 useKey
  - useKey 列表与作废
  - 会话列表
  - Drawer 查看会话详情与 10/20 轮总结

## Review 记录

- 这次刻意没有把公开站主入口继续压在 `/ai-talk/chat` 路由里，而是提升到全局 Drawer，确保“跨页面可访问”是第一性原则。
- MVP 首屏不再让访客先理解 `useKey`，而是先同意隐私/IP 提示后直接进入对话，把门槛压到最低。
- 公开站问答没有新建第二套 RAG，而是直接包在现有 `RagService.ask()` 之上，降低链路分叉风险。
- `project_card / experience_card` 首版先做“基于 citations 回映已发布简历快照”的轻结构化，不强依赖第二次长耗时 AI 调用。
- 总结能力只放在第 10 / 20 次节点触发，避免把每轮问答都变成重工作流。

## 遇到的问题

- HeroUI 在 web 端的 `Input` / `Button` 契约和直觉略有差异：
  - `Input` 使用 `onChange`
  - `Button` 没有 `isLoading` / `color` 这些 prop
- `packages/api-client` 有一条约束测试：domain facade 不能直接暴露 `export async function`，所以 AI Chat stream 方法需要和简历导入 SSE 一样改成同步导出 + 内部 async 实现。
- 因为这轮新增了多张 SQLite 表，必须在服务启动时补齐表结构，否则老库会直接报缺表。
- 旧库升级时如果先创建依赖新列的索引、再补列，会触发启动失败；这次已经把顺序调整为“先补列，再建索引”。

## 测试与验证

已完成：

- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/api-client build`
- `pnpm --filter @my-resume/api-client test -- src/ai.spec.ts`
- `pnpm --filter @my-resume/web test -- 'app/[locale]/_resume/__tests__/published-resume-hero.spec.tsx' 'app/_shared/ai-chat/__tests__/ai-chat-context.spec.tsx' 'app/_shared/ai-chat/__tests__/ai-chat-drawer.spec.tsx'`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm check:tsx-types`
- `git diff --check`
- 浏览器手工验证：
  - 点击头像弹出隐私 / IP 提示 Modal
  - 点击“同意并继续”后打开全局 Drawer
  - 点击“关闭”后缩成右下角最小化 Dock
  - 点击 Dock 可恢复 Drawer

当前仍可继续补充：

- server 侧 `AiChatService / AiChatController` 单测与 SSE 行为测试
- web Drawer 的交互测试
- admin 治理台的列表与 Drawer 测试

## 后续可写成教程 / 博客的切入点

- 如何把“说明页 AI 入口”升级为“真正可跨页面访问的全局 Drawer 产品入口”
- 如何在不暴露复杂治理模型的前提下，用 IP 日限次 + 轻提示先做一个公开站 MVP
- 如何在现有 RAG 问答基础上补一层 answer blocks，把普通文本回答提升为结构化展示
- 如何用 SQLite + Drizzle 在教程型项目里渐进补齐新业务表，而不一次引入完整迁移系统

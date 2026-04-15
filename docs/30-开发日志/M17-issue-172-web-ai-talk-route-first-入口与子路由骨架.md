# M17 issue-172：web ai-talk route-first 入口与子路由骨架

## 背景

`ai-talk` 后续会承接 RAG 对话、数字人自我介绍、会话历史等能力。如果继续把它当作单一占位页，后续接入试用码、多轮会话与媒体交互时会反复重构页面结构。

## 本次目标

- 将 `/{locale}/ai-talk` 固定为 AI Talk SSR 中枢入口。
- 新增 `/{locale}/ai-talk/chat`、`/{locale}/ai-talk/avatar`、`/{locale}/ai-talk/sessions/[sessionId]` 子路由骨架。
- 当前只做信息架构与 `coming soon` 契约，不接真实 server 对话链路。

## 实际改动

- 新增 `apps/web/app/[locale]/ai-talk/_ai-talk/page-frame.tsx`，统一公开站头部、发布快照同步与空状态处理。
- 新增 `apps/web/app/[locale]/ai-talk/_ai-talk/load-page-data.ts`，收口 AI Talk 路由共享的 SSR 首取逻辑。
- 将旧 `placeholder-shell` 替换为 `entry-shell`，入口页展示 RAG 对话、数字人自我介绍、会话历史三张能力卡。
- 新增 `chat`、`avatar`、`sessions/[sessionId]` 子路由与对应 route-private shell。
- 扩展 `aiTalk` 中英文 i18n 文案，覆盖入口、chat、session、avatar 页面 copy。
- 更新 `ai-talk` 模块 README，记录 route-first 结构与后续边界。

## Review 记录

- 本轮只处理 `apps/web` 的 `issue-172`，没有扩到 `admin`、`server` 或真实 RAG 数据模型。
- `chat` 与 `session` 只预留试用码、10 轮问答、流式响应、来源片段等 UI 契约。
- `avatar` 只预留角色信息、媒体资源与交互控制区边界，不接 TTS / 视频 / 数字人服务商。

## 遇到的问题

- 测试中 “RAG 对话” 与 “来源片段” 同时出现在 chip 和卡片标题里，断言改为 `getAllByText` 以匹配真实页面结构。
- 本地已有 `M16 issue-172` 相关日志，本轮按新里程碑明确命名为 `M17 issue-172`，避免与旧编号语义混淆。

## 测试与验证

- `pnpm --filter @my-resume/web test -- ai-talk`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`

## 教程 / 博客切入点

- Next App Router 下如何用 route-first 方式为未来复杂交互域预留结构。
- 如何在不接真实后端前，先用 SSR 入口页 + 子路由占位契约降低后续重构成本。
- 如何区分“产品信息架构落地”和“真实业务闭环实现”的 issue 边界。

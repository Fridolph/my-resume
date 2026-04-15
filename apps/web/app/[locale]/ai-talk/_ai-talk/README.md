# ai-talk 模块

公开站 AI Talk 入口模块。

## 职责

- `entry-shell.tsx`：`/{locale}/ai-talk` SSR 卡片中枢入口壳
- `entry-shell.module.css`：入口页 Hero Row 与 3D 翻转卡片样式
- `page-frame.tsx`：AI Talk 子路由共享页框架，统一公开站头部与发布快照同步
- `load-page-data.ts`：AI Talk 路由共享的服务端首取逻辑
- `chat/_chat/`：RAG 对话入口页的 route-private 实现
- `avatar/_avatar/`：数字人自我介绍页的 route-private 实现
- `sessions/[sessionId]/_session/`：未来真实会话页的 route-private 实现
- `__tests__/`：AI Talk 模块测试
- `types/`：预留模块本地类型目录

## 边界

- 当前只消费已发布简历快照，不承载真实问答接口
- `chat`、`avatar`、`sessions/[sessionId]` 目前只建立信息架构与页面契约
- 入口页当前只负责产品入口说明与功能卡片展示，不承担 admin 跳转或后台治理逻辑
- 真实试用码、流式问答、会话审计与知识库治理放到后续 issue 落地

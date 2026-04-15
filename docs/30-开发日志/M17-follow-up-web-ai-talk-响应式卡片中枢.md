# M17 Follow-up：web ai-talk 响应式卡片中枢

## 背景

`ai-talk` 已经完成 route-first 骨架，但入口页仍然偏占位说明，无法清晰承担公开站 AI 能力入口的展示职责。

## 本次目标

- 将 `/{locale}/ai-talk` 升级为顶部概览 + 3 张功能卡片的中枢入口页。
- 用响应式 grid 承接后续 1~4 列扩展需求。
- 为桌面端补上 3D 翻转过渡，同时让移动端直接展示信息更完整的背面。

## 实际改动

- 重构 `AiTalkEntryShell`，将原先的多块说明卡改为 Hero Row + 3 张功能入口卡。
- 新增 `entry-shell.module.css`，复用现有 3D flip 思路实现桌面 hover 翻转与移动端直接背面展示。
- 新增 `hubRow`、`featureCards.rag`、`featureCards.resumeAdvisor`、`featureCards.avatar` 文案结构。
- 更新入口页测试，改为验证 Hero Row、3 张卡、RAG/数字人 CTA 和“简历优化卡无公开跳转”。

## Review 记录

- 本轮只改 `web ai-talk` 入口页，不改 `chat` / `avatar` / `sessions` 子路由实现。
- “简历优化与建议”卡保持公开站说明态，不承担 admin 跳转职责。
- 移动端按既定决策直接展示背面信息，避免 hover 才能看清卡片内容。

## 测试与验证

- `pnpm --filter @my-resume/web test -- ai-talk`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/web build`

## 教程切入点

- 如何把“入口占位页”逐步演化成面向未来能力扩展的卡片中枢。
- 响应式 grid + 桌面 3D 翻转 + 移动端直接背面展示的实现取舍。

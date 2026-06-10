# M25 / issue #225：AI Intro 体验收口与文档沉淀

## 背景

#221-#224 已经完成 AI Intro 路由壳、10 个预设问题状态机、右侧解锁面板和 Answer Block Renderer。#225 作为 M25 收口 issue，重点确认首版体验可演示、可复盘，并为 M26 多域 RAG 留出清晰边界。

## 本次目标

- 收口 Intro 页的最小交互细节。
- 补充 10 步完整流程和重置流程测试。
- 沉淀源码拆解入口，方便后续教程和 M26 接棒。
- 明确 M25 已完成与 M26 不在本轮处理的边界。

## 非目标

- 不新增后端接口。
- 不接入真实 LangGraph / 多域 RAG。
- 不扩展 AI 生成逻辑。
- 不做发布运营文案。

## 实际改动

- 在引导式聊天窗口中新增“重置进度”按钮，方便演示和验收反复跑 10 步流程。
- 补充中英文文案 `introPage.chat.resetAction`。
- 扩展 Intro 测试：初始重置按钮禁用、完成主题后可重置、右侧拼图重新回到 locked 状态。
- 新增 M25 AI Intro 源码拆解文档。

## Review 记录

- Reset 只清空本地 `completedTopics`，不改变 localStorage key 结构，避免影响 #222 的恢复逻辑。
- 右侧解锁面板继续只依赖 `completedTopics`，保持展示层和状态层分离。
- 本轮没有引入新依赖，也没有改动 Chat / RAG 服务端链路。

## 测试与验证

- `pnpm --dir apps/web exec vitest run 'app/[locale]/ai-talk/intro/_intro/__tests__/intro-shell.spec.tsx' 'app/_shared/ai-chat/__tests__/ai-chat-answer-block-renderer.spec.tsx'`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm check:tsx-types`
- `git diff --check`

## 桌面与移动端验证记录

- 桌面：Intro 页面采用 `lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]` 双栏布局；左侧聊天壳与右侧解锁地图并列，10 个问题可完整点击完成。
- 移动端：断点以下自动退回单列布局，问题按钮使用 `grid gap-2 sm:grid-cols-2`，右侧解锁地图下移，仍可完成 10 步和 reset 流程。
- 本轮未启动浏览器人工点验；以组件测试、响应式类检查和类型检查作为收口验证。若发版前需要视觉确认，建议再跑一次本地浏览器桌面/移动端检查。

## 遗留风险与后续

- M25 仍是本地预设回答，不代表真实 RAG 质量。
- 右侧“拼图”仍是主题块表达，不是真正图片切片或技能树。
- M26 将继续处理 LangGraph 多域路由、RAG 数据域拆分和高质量结构化回答生成。

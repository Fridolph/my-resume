# M25 / issue #222：AI Intro 预设问题流程与 10 步状态机

## 背景

#221 已经建立 `/{locale}/ai-talk/intro` 独立页面壳。#222 继续把静态页面升级为可交互的引导流程：首版只允许用户选择预设问题，避免体验发散，并为后续右侧解锁地图和真实 AI 回答留出稳定状态模型。

## 本次目标

- 定义 10 个预设问题。
- 点击问题后追加用户问题与本地回答。
- 已完成问题进入 completed 状态并禁用。
- 页面刷新后通过 localStorage 恢复已完成进度。
- 为后续 #223 解锁地图和 #224 answer blocks 保留扩展空间。

## 非目标

- 不开放自由输入。
- 不调用真实 AI 接口。
- 不实现复杂解锁动效。
- 不接入 LangGraph 或多域 RAG。

## 实际改动

- `intro-shell.tsx` 增加 `completedTopics` 状态、localStorage 读写、线程消息推导和问题点击处理。
- 中英文 `aiTalk.json` 增加 10 个问题与对应本地回答文案。
- 新增 `types/intro-shell.types.ts`，满足 TSX 类型拆分约定。
- 扩展 intro shell 测试，覆盖首次渲染、点击完成问题、刷新恢复。

## Review 记录

- localStorage 只保存 `completedTopics`，不保存长文案，避免文案调整后历史数据脏掉。
- 线程消息由 completed topics 推导，后续可替换为服务端回答或 answer blocks。
- 已完成问题采用禁用策略，满足“不可重复触发或仅回看结果”的首版验收。

## 测试与验证

- `pnpm --dir apps/web exec vitest run 'app/[locale]/ai-talk/intro/_intro/__tests__/intro-shell.spec.tsx'`
- `pnpm --filter @my-resume/web typecheck`
- `git diff --check`

以上均通过。

## 遗留风险与后续

- 当前回答仍是本地文案，真实 AI 回答和结构化 card 展示放到后续 issue。
- 右侧解锁地图目前只根据 completed 状态轻量变色，完整拼图/解锁效果由 #223 收口。
- 进度跨语言使用独立 localStorage key，后续如需跨语言共享进度，可再做一次迁移。


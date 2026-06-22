# M25 / issue #223：AI Intro 右侧 10 块拼图解锁面板 MVP

## 背景

#222 已经完成 AI Intro 的 10 个预设问题状态机。#223 继续增强右侧区域，让它不只是静态列表，而是能随着问题完成呈现“碎片解锁”的进度反馈。

## 本次目标

- 将右侧解锁区拆成独立组件。
- 每个主题碎片具备 locked / completed 状态。
- 完成问题后展示关键词和最近解锁说明。
- 10 个问题全部完成后展示完整画像态。
- 复用 profile hero 图片作为视觉底，不新增图片资产。

## 非目标

- 不做 2D 数字人。
- 不做复杂技能树编辑器。
- 不接入图片富媒体知识库。
- 不改变 #222 的问题状态机存储结构。

## 实际改动

- 新增 `intro-topic-config.ts`，集中维护 10 个主题 key。
- 新增 `intro-unlock-map.tsx`，负责右侧解锁地图、进度条、碎片状态和完成态。
- 扩展 `intro-shell.types.ts`，补充 `IntroUnlockMapProps`。
- 补充中英文 unlock 文案：进度、关键词、摘要、完成态。
- 扩展测试覆盖单块解锁、最近解锁说明、全部完成状态。

## Review 记录

- 右侧组件只接收 `completedTopics`，不直接读写 localStorage，状态来源仍由 `intro-shell` 统一管理。
- 富媒体暂时只复用 `profile.hero.frontImageUrl`，避免引入上传中心或新资产管理。
- 完整地图状态基于 10 个问题完成数判断，后续 #224 可继续把解锁结果映射到 answer blocks。

## 测试与验证

- `pnpm --dir apps/web exec vitest run 'app/[locale]/ai-talk/intro/_intro/__tests__/intro-shell.spec.tsx'`
- `pnpm --filter @my-resume/web typecheck`
- `git diff --check`

以上均通过。

## 遗留风险与后续

- 当前拼图仍是 CSS / 主题块表达，不是真正图片切片；后续如要做真实拼图，可在不改变 `completedTopics` 的前提下替换渲染层。
- 解锁摘要仍来自本地文案；真实 AI 识别关键词和结构化 card 会在 #224 / M26 继续推进。


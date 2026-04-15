# M14 Follow-up 开发日志：公开简历 section card hover reveal 移除

## 背景

- 公开简历页的 `section card` 之前为“工作经历 / 代表项目”加了标题 hover 后再展示描述文案的交互。
- 实际使用中，这个 hover 会改变卡片高度，导致模块整体 reflow，阅读时容易产生跳动感。
- 当前反馈明确要求：这类 hover reveal 先全部取消，描述文案直接稳定展示。

## 本次目标

- 移除公开简历 `section card` 的 hover reveal 行为。
- 保持“工作经历 / 代表项目”描述文案始终可见。
- 不改模块内容结构，不额外扩展视觉交互。

## 实际改动

- 在 `apps/web/app/[locale]/_resume/published-resume-section-card.tsx` 中移除 `revealDescriptionOnTitleHover` 开关与相关 class 拼接。
- 在 `apps/web/app/[locale]/_resume/published-resume-experience-section.tsx` 与 `apps/web/app/[locale]/_resume/published-resume-projects-section.tsx` 中移除该开关传递。
- 在 `apps/web/app/[locale]/_resume/published-resume-section-card.module.css` 中删除 hover reveal 对应样式与 transition。
- 更新 `apps/web/app/[locale]/_resume/__tests__/shell.spec.tsx`，不再断言 hover reveal class，只验证文案正常展示。

## Review 记录

- 这次选择直接删除交互，而不是继续调动画时长或高度阈值。
- 原因是这个交互不是核心信息表达，保留反而会破坏公开简历页最重要的“稳定扫读感”。
- 先收住阅读稳定性，比继续保留一个弱收益 hover 提示更合适。

## 测试与验证

- 通过：
  - `pnpm --filter @my-resume/web exec vitest run 'app/[locale]/_resume/__tests__/shell.spec.tsx'`
  - `pnpm --filter @my-resume/web exec tsc --noEmit`
  - `pnpm --filter @my-resume/web build`

## 后续可写成教程/博客的切入点

- 为什么公开简历页要优先控制 reflow，而不是继续叠加 hover 动效
- 什么场景适合“默认展示”，什么场景才适合“hover reveal”

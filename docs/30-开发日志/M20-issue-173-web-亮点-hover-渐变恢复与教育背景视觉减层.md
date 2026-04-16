# M20 / issue-173 web 亮点 hover 渐变恢复与教育背景视觉减层

## 背景
- web 展示端亮点卡的 hover 金属渐变效果丢失，卡片交互反馈变弱。
- 教育背景模块内层学校卡片造成了一层包一层的视觉体验。

## 本次目标
- 恢复亮点卡 hover 时的浅金属光泽渐变效果。
- 去掉教育背景模块内层卡片壳，只保留更轻的内容层次。

## 实际改动
- 在 `published-resume-highlights-section.tsx` 为亮点卡补回 hover 渐变层与更轻的 hover 阴影过渡。
- 在 `published-resume-education-section.tsx` 去掉 `timelineCardSurface` 包裹，改为更轻的分隔式内容布局。
- 在 `shell.spec.tsx` 补充教育背景减层后的回归断言。

## Review 记录
- 未调整教育内容结构、字段顺序或亮点信息组织。
- 仅收敛 hover 视觉与教育模块层级感。

## 遇到的问题
- 原测试尝试直接断言亮点卡 DOM，但当前 shell 测试不直接覆盖该节点，改为保留稳定可验证的教育模块断言。

## 测试与验证
- `pnpm --filter @my-resume/web exec vitest run 'app/[locale]/_resume/__tests__/shell.spec.tsx'`
- 本地通过。

## 后续可写成教程 / 博客的切入点
- 如何通过轻量 hover 渐变恢复卡片交互反馈，而不引入位移动效。
- 如何在已有 section 容器中做“视觉减层”，避免重复 card 包裹。

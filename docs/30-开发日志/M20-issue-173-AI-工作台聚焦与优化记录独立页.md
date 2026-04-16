# M20-issue-173：AI 工作台聚焦与优化记录独立页

- Issue：M20 Follow-up v2 / AI 工作台聚焦收口 + 优化记录独立页
- 里程碑：M20
- 分支：`fys-dev/feat-m20-issue-171-ai-draft-optimization`
- 日期：2026-04-15

## 背景

上一轮已经完成了“当前草稿优化 → 独立结果页 → 模块级 apply”的主闭环，但在继续验收时，页面职责和信息层级仍然不够稳定：

- `/dashboard/ai` 同时承载输入、最近优化记录、缓存体验，主路径不够聚焦
- “正在分析当前草稿”虽然有 rich loading，但仍嵌在表单内部，不像一个可讲解的重点交互
- 结果页字段对比已经能用，但视觉区分不强，且只有最终文案，没有把“建议”与“原因”说完整

这次任务继续只做 M20，不进入编辑器内联，而是把 AI 工作台进一步收口为更适合教学和演示的结构。

## 本次目标

- 把 `AI 工作台` 收口为输入 / 分析 / 跳结果页三段式
- 新增独立页面 `优化记录`，承接最近优化记录与缓存体验
- 侧边栏新增平级入口 `优化记录`
- 把 pending 交互抽为工作台内独立重点模块
- 结果页补齐字段级建议说明与字段级原因说明

## 实际改动

- 导航与路由
  - 新增侧边栏平级入口 `优化记录`
  - 新增路由 `/dashboard/ai/optimization-history`
  - 导航 active 逻辑调整为最长前缀匹配，避免 `/dashboard/ai/optimization-history` 同时命中 `AI 工作台`
- AI 工作台
  - 移除 `最近优化记录` 与 `缓存体验`
  - 新增 `进入优化记录` 入口
  - 将 pending 状态抽成 `resume-optimization-pending-panel.tsx`
- 优化记录页
  - 新增 `optimization-history-shell.tsx`
  - 集中展示：
    - 本地 recent optimization history
    - cached reports / viewer 只读体验
    - 回填 JD 后返回工作台继续分析
- 结果页
  - 字段 diff DTO 新增：
    - `suggestion`
    - `reason`
  - 字段对比区升级为：
    - 中性基线卡片
    - 蓝色建议卡片
    - 建议说明
    - 原因说明
- 服务端
  - `AiResumeOptimizationDiffEntry` 同步新增 `suggestion` / `reason`
  - 结果整理阶段为每条 diff 生成字段级说明
  - prompt 规则增加“字段表达必须可辩护、不要引入无依据指标”的约束

## Review 记录

- “优化记录”独立页是这轮最关键的 IA 收口点：把输入主路径和回看主路径彻底拆开，工作台职责明显更清楚
- 侧边栏没有上二级折叠导航，而是先做平级入口，是为了继续控制本轮范围
- 字段级解释信息放在结构化 diff DTO 中，而不是只靠前端写死文案，后续更容易演进到更细的 AI 解释层

## 自测结果

- Admin：
  - `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-shell.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/optimization-history-shell.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/resume-optimization-result-shell.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-api.spec.ts' 'app/[locale]/dashboard/_shared/__tests__/protected-layout.spec.tsx'`
  - `pnpm --filter @my-resume/admin build`
  - `pnpm --filter @my-resume/admin exec tsc --noEmit`
- Server：
  - `pnpm --filter @my-resume/server exec vitest run 'src/modules/ai/__tests__/ai-resume-optimization.service.spec.ts' --config ./vitest.config.mts`

## 遇到的问题

- 侧边栏 active 判定原来使用简单 `startsWith`，导致新页命中 `/dashboard/ai` 时会和 `AI 工作台` 同时高亮
  - 处理方式：统一改成 exact first + 最长前缀匹配
- 结果页字段级说明是多条重复结构，测试不能再用单个 `getByText('建议说明')`
  - 处理方式：改为 `getAllByText` + 具体文案断言

## 可沉淀为教程/博客的点

- 为什么 AI 页面最终会自然拆成“工作台 / 结果页 / 记录页”三种职责
- 为什么 pending 模块值得作为单独组件，而不是永远塞在表单内部
- 为什么字段级建议说明和原因说明能显著提升“AI 结果的可解释性”
- 侧边栏 active 匹配在新增嵌套路由时常见的误判方式

## 后续待办

- 如果后面确认“优化记录”价值稳定，再考虑从本地 history 升级到服务端历史表
- 如果后续进入 M21，可把字段级 `suggestion / reason` 继续用于编辑器 section 内联建议层

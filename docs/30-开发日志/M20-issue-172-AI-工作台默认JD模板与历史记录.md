# M20-issue-172：AI 工作台默认 JD 模板与历史记录

- Issue：M20 Follow-up / AI 工作台输入保留与历史回看
- 里程碑：M20
- 分支：`fys-dev/feat-m20-issue-171-ai-draft-optimization`
- 日期：2026-04-15

## 背景

前一轮已经把“当前草稿优化 → 独立结果页 → 模块级 apply”闭环搭起来了，但实际使用时还有两个非常明显的体验问题：

- 每次进入 `/dashboard/ai`，JD 输入区都像一个全新表单，需要重复粘贴
- 结构化建议生成后，虽然可以进结果页，但缺少一个轻量的“最近分析记录”入口，不方便快速回看或复用同一份 JD

这一轮继续聚焦 M20，不扩张到新的侧边栏 IA，而是在现有 AI 工作台页内做最小但实用的收口。

## 本次目标

- 把“高级全栈工程师 JD”保存为默认 mock 模板
- 支持本地持久化当前输入内容，避免刷新后丢失
- 在 AI 工作台页内新增最近优化记录面板
- 支持从历史记录：
  - 直接打开结果页
  - 一键回填当时的 JD / 优化要求
- 补测试与开发日志，方便后续写成 AI 前端交互教程

## 非目标

- 不新增侧边栏 AI 子入口
- 不做服务端持久化历史结果列表
- 不改变当前结果页路由结构
- 不扩展到 M21 的编辑器内联建议体系

## 实际改动

- 新增本地持久化工具：
  - `apps/admin/app/[locale]/dashboard/ai/_ai/utils/resume-optimization-persistence.ts`
  - 提供默认 JD 模板、输入内容存储、历史记录读写工具
- 新增最近优化记录面板：
  - `apps/admin/app/[locale]/dashboard/ai/_ai/components/resume-optimization-history-panel.tsx`
  - 展示最近几次结构化建议结果的摘要、影响模块、时间与操作按钮
- 更新 AI 工作台壳：
  - `apps/admin/app/[locale]/dashboard/ai/_ai/ai-workbench-shell.tsx`
  - 首次进入自动加载默认 JD 模板
  - 如果本地有缓存输入，则优先恢复缓存输入
  - 结构化建议成功后自动写入本地历史
  - 增加“恢复默认 JD 模板”操作
- 更新分析面板：
  - `apps/admin/app/[locale]/dashboard/ai/_ai/components/analysis-panel.tsx`
  - 在生成结构化建议成功后，向外抛出 `onOptimizationGenerated`
  - 让工作台壳可以统一接管历史记录写入

## Review 记录

- 这次选择“页内历史面板”，而不是新增菜单入口，是为了继续遵守 M20 的范围控制
- 历史结果采用本地存储，而不是马上做服务端历史表，原因是：
  - 当前需求核心是“别重复输入”和“快速回看”
  - 本地存储实现更轻、更适合教学节奏
  - 不会干扰现有 `resultId + server cache` 的结果承接边界
- 默认 JD 模板并不是覆盖用户输入；一旦用户手动修改，本地缓存内容优先级更高

## TDD / 测试设计

- `apps/admin/app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-shell.spec.tsx`
  - 覆盖默认 JD 模板自动加载
  - 覆盖“恢复默认 JD 模板”
  - 覆盖结构化建议成功后写入历史记录
  - 覆盖从历史记录回填输入区
- `apps/admin/app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx`
  - 保留前一轮 Rich Loading / 跳结果页相关测试，确保本次回调扩展不破坏原闭环

## 自测结果

- 测试：
  - `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-shell.spec.tsx' 'app/[locale]/dashboard/ai/_ai/__tests__/analysis-panel.spec.tsx'`
- 构建：
  - `pnpm --filter @my-resume/admin build`
- 类型：
  - `pnpm --filter @my-resume/admin exec tsc --noEmit`
  - 说明：首次直接执行时，`apps/admin/tsconfig.json` 依赖 `.next/types`，因此需要在 build 后再次确认，最终通过

## 遇到的问题

- `tsc --noEmit` 首次执行会因为 `.next/types` 尚未生成而报错
  - 处理方式：先执行 `pnpm --filter @my-resume/admin build` 生成 Next 类型，再补跑 `tsc`
- 既有测试默认假设输入为空
  - 处理方式：把断言调整为默认 JD 模板存在，并新增本地历史回填相关用例

## 可沉淀为教程/博客的点

- 为什么 AI 工作台里“默认模板 + 本地持久化”是很高性价比的体验增强
- 为什么“结果页路由”与“页内最近记录”可以同时存在，而不是互相替代
- 在 AI 功能里，哪些状态适合服务端缓存，哪些状态更适合本地存储
- 如何给“会重复填写的大输入框”设计一个对真实用户更友好的默认态

## 后续待办

- 如果后面确认 AI 入口会继续扩展，再考虑把“最近优化记录”升级为单独的 AI 管理视图
- 当服务端需要跨设备同步历史时，再把本地历史升级为数据库表或用户级历史接口
- 后续教程里可专门拆一节：结果页、服务端缓存、本地历史三者的职责边界

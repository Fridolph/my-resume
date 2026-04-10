# M16 / issue-169：web 技能区延后挂载与首页主链路收口

## 背景

- 在 `issue-168` 里已经确认，`apps/web` 的最大静态资源仍然是图表相关的 `echarts` 大 chunk。
- 但同时也确认了一个关键点：最大 chunk 不等于首页首屏一定同步加载。
- 因此这轮不继续盲目追求“把大 chunk 直接做消失”，而是优先把技能区从首页主链路里再往后挪一层，让首页先更轻地进入可交互状态。

## 本次目标

- 将技能区从 `PublishedResumeShell` 的主同步渲染链路中拆出。
- 保留现有技能区视觉与交互，不改业务数据结构，不改公开页面 IA。
- 在测试环境下保持稳定，避免为了性能拆分而导致 shell 用例变脆。

## 实际改动

- `apps/web/components/published-resume/shell.tsx`
  - 将 `PublishedResumeSkillsSection` 改为 `next/dynamic` 动态加载
  - 通过 `IntersectionObserver` 让技能区在接近视口时再真正挂载
  - 新增轻量 `SkillsSectionPlaceholder`，在未挂载前维持页面结构和文案连续性
- `apps/web/components/published-resume/__tests__/shell.spec.tsx`
  - 将技能区相关断言改为异步等待，适配动态挂载

## Review 记录

- 这轮仍遵守“先切主链路，再谈极限压缩”的节奏：
  - 不重写 locale 切换模式
  - 不把 `PublishedResumeShell` 整体回退成 server-only 架构
  - 不改图表视觉、不替换图表库
- 重点是把“技能区 + 图表能力”进一步从首页同步执行路径中移开。

## 遇到的问题

- `PublishedResumeSectionCard` 要求 `eyebrow` 必填，占位卡片初版漏传导致 build 失败。
- 技能区动态挂载后，原先同步断言的测试会直接找不到“技能结构 / Skill Structure”，需要改为 `findBy*`。
- 这轮总静态产物没有下降，说明优化收益主要体现在首页主 chunk，而不是整体产物体积。

## 测试与验证

- `pnpm --filter @my-resume/web build` ✅
- `pnpm --filter @my-resume/web typecheck` ✅
- `pnpm --filter @my-resume/web test` ✅
- `node scripts/perf-build-analyze.mjs --apps web --output .tmp/perf/build-web-after-issue-169.json` ✅

## 结果观察

- 首页 `Route (app) /`：
  - 页面 chunk 从约 `34.74 KiB` 降到约 `24.21 KiB`
  - `First Load JS` 从约 `202 kB` 降到约 `200 kB`
  - route size 从约 `24.7 kB` 降到约 `22.8 kB`
- 同时：
  - `echarts` 相关最大 chunk 约 `433KB` 仍然存在
  - 但它已经进一步偏离首页主同步链路，更接近“延后加载的技能区资源”

## 后续可写成教程/博客的切入点

- 为什么“最大 chunk 还在”并不等于这轮优化没有价值。
- 在 Next App Router 下，如何通过 `dynamic + IntersectionObserver` 把低优先级区块从首页主链路中挪开。

# M16 / issue-168：web chunk 归因与 prefetch 治理

## 背景

- 在前一轮性能治理后，`admin` 的主 CSS 与共享壳已经明显变轻。
- 但从最新 `perf-build-analyze` 输出看，`apps/web` 仍存在一个约 `433KB` 的大 chunk，容易让人误以为首页首屏仍然“很重”。
- 同时，`web / admin` 都存在默认 `Link prefetch`，会让本地浏览时的网络面板看起来像“页面很小却仍在拉很多资源”。

## 本次目标

- 先确认 `web` 最大 chunk 的主要来源，避免继续盲改。
- 对明显不需要抢先预取的跨路由链接关闭 `prefetch`，降低开发时和部署后的无感知预拉取。
- 继续保持教学友好：先归因、再治理，不直接扩大成全面重构。

## 实际改动

- 归因确认：
  - 读取 `apps/web/.next/static/chunks/179.fa2a6cc7d3f93814.js`
  - 结果显示该 chunk 仍包含 `echarts` 相关内容，说明当前最大 chunk 的主热点仍然是图表链路，而不是 HeroUI 或主题壳本身
- 收口默认预取：
  - `apps/web/components/site/header.tsx`
    - 站点品牌链接
    - 顶部导航 `/`、`/profile`、`/ai-talk`
  - `apps/web/components/profile/overview-shell.tsx`
    - 跳转 `/ai-talk`
  - `apps/admin/components/admin/dashboard-shell.tsx`
    - 概览页三个快捷入口
  - `apps/admin/components/admin/protected-layout.tsx`
    - 未登录返回首页
    - breadcrumb 返回 `/dashboard`

## Review 记录

- 这轮没有继续硬压 `web` 首页 `First Load JS`，因为先确认后发现：
  - `433KB` 是大 chunk 热点，但并不等于首页一定首屏同步执行
  - 当前更高价值的是先减少默认预取造成的“额外路由资源提前加载”
- 因此本轮聚焦“归因 + 低风险治理”：
  - 不改 resume schema
  - 不改 API
  - 不回退 HeroUI / ECharts

## 遇到的问题

- `Next build` 输出的 `First Load JS` 与 `.tmp/perf/build-report.json` 中的“最大静态资源文件”不是一个维度，阅读时容易混淆。
- 当前仓库里仍有根级 `.eslintrc.json` 的 `@nx/eslint-plugin` 缺失噪音，已在后续工程清理中单独收口，不再继续保留为已知噪音。

## 测试与验证

- `pnpm --filter @my-resume/web build` ✅
- `pnpm --filter @my-resume/admin build` ✅
- `pnpm --filter @my-resume/web test` ✅
- `pnpm --filter @my-resume/admin test` ✅
- 补充说明：
  - 本轮变更主要影响导航预取行为，因此预期不会显著改变构建体积
  - 但它可以减少本地开发和部署后浏览时，由 `Link prefetch` 带来的相邻路由资源预拉取

## 当前结论

- `web` 端后续仍有优化空间，但下一步应该更聚焦：
  - 继续拆 `echarts` 图表链路
  - 明确哪些大 chunk 真的是首屏阻塞，哪些只是按需或预取资源
- `admin` 端现在更适合进入部署后真实环境观测，而不是继续只看本地体感。

## 后续可写成教程/博客的切入点

- 如何正确理解 `First Load JS`、最大 chunk 与预取资源三者的区别。
- 为什么在 App Router 下，默认 `Link prefetch` 可能让“小页面看起来也像加载了很多东西”。

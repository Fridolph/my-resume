# M16 / issue-167：admin dashboard 路由级重依赖收口

## 背景

- 在 `issue-166` 完成共享包产物化后，`web/admin` 已经不再通过 `transpilePackages` 重复转译 `@my-resume/api-client` 与 `@my-resume/ui`。
- 但进一步观察 dev 冷启动日志后，后台首次访问的主要耗时仍集中在路由级冷编译，而不是 shared package 本身。
- 因此本轮继续聚焦 `apps/admin`，优先把 dashboard 域的重入口和壳层依赖继续向路由边界收口。

## 本次目标

- 把 `dashboard` 首页与 `dashboard layout` 也切到动态入口，避免在最外层同步拉起整块后台壳。
- 统一后台 dashboard 子路由的 loading 反馈，实现更轻的路由入口层。
- 对后台顶层壳组件改用 HeroUI 子路径导入，减少大包 barrel 参与顶层路由编译。

## 实际改动

- 新增复用加载壳：
  - `components/admin/route-loading-card.tsx`
- 路由级动态化：
  - `app/dashboard/page.tsx`
  - `app/dashboard/layout.tsx`
  - `app/dashboard/resume/page.tsx`
  - `app/dashboard/ai/page.tsx`
  - `app/dashboard/publish/page.tsx`
- 顶层后台 shell 改为 HeroUI 子路径导入：
  - `components/admin/dashboard-shell.tsx`
  - `components/admin/ai-workbench-shell.tsx`
  - `components/admin/resume-shell.tsx`
  - `components/admin/publish-shell.tsx`
  - `components/admin/protected-layout.tsx`
- 第二轮继续收口根共享链路：
  - 新增 `lib/admin-session-store.ts`
  - 将 `AdminSessionProvider` 的会话缓存从 `admin-resource-store` 中拆出，避免根 provider 提前带入 AI / resume 资源缓存逻辑
  - `login-shell` 改为直接预热轻量 session store
- 第二轮继续收口后台样式：
  - 新增 `app/admin-shell.css`
  - 将 `globals.css` 中只服务后台壳与工作区的辅助样式迁到路由级 CSS
  - `@my-resume/ui/display.css` 改为从 `admin-shell.css` 注入，不再挂在根 `globals.css`
  - `ThemeModeToggle` 改用 `@heroui/react/switch` 子路径导入

## Review 记录

- 本轮仍坚持“低风险、可解释”的拆分方式：
  - 不动业务数据接口
  - 不改 dashboard IA
  - 不提前扩到 `web`
- 重点是把最上层路由入口先变薄，让重工作区组件只在真正访问对应页面时再加载。
- 第二轮延续同样原则：
  - 不引入新的状态库
  - 不重写后台主题体系
  - 只拆根共享依赖与共享 CSS 装载位置

## 遇到的问题

- 外部临时 dev 服务的可达性在沙箱内与沙箱外存在差异，因此 perf 采集需要区分运行环境。
- 但从 dev 服务日志依然可以直观看出首次编译热点集中在页面级模块，而不是 shared package。
- `vitest` 在和 `next build` 并行时容易把 `draft-editor-panel` 长测例拖慢到超时，因此后续验证改为串行执行。
- `protected-layout` 的 HeroUI mock 一度受到 `vi.mock` hoist 影响，需要把 mock 工厂也挪进 `vi.hoisted()` 中。

## 测试与验证

- 已执行：
  - `pnpm --filter @my-resume/admin build` ✅
  - `pnpm --filter @my-resume/admin typecheck` ✅
  - `pnpm --filter @my-resume/admin test` ✅
  - `node scripts/perf-build-analyze.mjs --apps admin --output .tmp/perf/build-admin-after-session-split.json` ✅
  - `node scripts/perf-build-analyze.mjs --apps admin --output .tmp/perf/build-admin-after-route-css-split.json` ✅
- 本轮关键结果：
  - `static/chunks/app/layout.js` 从约 `186.92 KiB` 降到约 `147.46 KiB`
  - admin 最大 CSS 从约 `152.08 KiB` 降到约 `145.60 KiB`
  - admin 静态产物总量进一步下降约 `294922 bytes`
- 人工关注：
  - dashboard 首屏 skeleton 是否正常
  - protected layout、sidebar、session dropdown、mobile drawer 是否无回归

## 后续可写成教程/博客的切入点

- 为什么 monorepo 性能优化在共享包产物化之后，还要继续做“路由级重依赖收口”。
- Next App Router 中，如何用动态入口先把 admin 工作区壳层变薄。

# M16 / issue-166：workspace 共享包产物化与 dev 冷编译收口

## 背景

- `apps/web` 与 `apps/admin` 当前都通过 `transpilePackages` 直接转译 `@my-resume/api-client` 与 `@my-resume/ui` 的 TypeScript 源码。
- 这种方式实现简单，但会把 workspace 包也拉进 Next dev 的冷编译链路，放大首次启动与首次路由编译成本。
- M16 当前目标之一，就是优先处理这类“共享包被重复转译”的低风险热点。

## 本次目标

- 为 `packages/api-client` 与 `packages/ui` 提供可直接消费的 `dist` 产物。
- 让 `apps/web` 与 `apps/admin` 停止使用 `transpilePackages` 转译这两个共享包。
- 保持当前业务接口、组件 API 与样式行为不变。

## 实际改动

- 为 `packages/api-client` 新增：
  - `build` / `dev` 脚本
  - `tsconfig.build.json`
  - `exports` 从源码切到 `dist/index.js`
- 为 `packages/ui` 新增：
  - `build` / `dev` 脚本
  - `tsconfig.build.json`
  - `theme / display` 子路径改为消费 `dist/*.js`
  - `display.css` 继续保留为源码 CSS 入口，避免额外复制链路
- `apps/web/next.config.ts` 与 `apps/admin/next.config.ts` 去掉 `transpilePackages`
- 根 `package.json` 新增/调整：
  - `build:shared`
  - `dev:shared`
  - `dev:web` / `dev:admin` / `dev:all` 先执行 `build:shared`
  - `test:unit` 与 `perf:build:analyze` 先执行 `build:shared`

## Review 记录

- 这轮选择“共享包先产物化，再让 Next 直接吃产物”而不是继续在 app 侧做更多编译黑科技。
- 原因是这个方案更适合教程型演进：
  - 易解释
  - 风险低
  - 更接近后续 UI library / shared package 的自然形态
- 暂未把 `display.css` 也复制到 `dist`，避免增加 CSS 资产同步复杂度；当前收益点主要在 TS/TSX 转译链路收口。

## 遇到的问题

- 如果共享包 runtime 入口切到 `dist`，则在 app 运行测试、构建、dev 前，需要保证共享包至少先 build 一次。
- 本轮通过根脚本统一先跑 `build:shared` 收口，优先保证主工作流稳定。

## 测试与验证

- 待本 issue 完成后执行：
  - `pnpm build:shared`
  - `pnpm --filter @my-resume/web build`
  - `pnpm --filter @my-resume/admin build`
  - `pnpm --filter @my-resume/web test`
  - `pnpm --filter @my-resume/admin test`
  - `pnpm --filter @my-resume/web typecheck`
  - `pnpm --filter @my-resume/admin typecheck`
  - `pnpm run perf:dev:web`
  - `pnpm run perf:dev:admin`

## 后续可写成教程/博客的切入点

- 为什么 monorepo 里的 Next app 不应该长期依赖 `transpilePackages` 去转共享业务包。
- 教程型项目里，如何从“源码直连”渐进迁移到“共享包产物化”。
- `dist` 产物化、根脚本收口与 workspace 依赖图之间的权衡。

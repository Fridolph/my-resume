# M16 / issue-170：admin 共享壳链路收口

## 背景

- 后台几个工作区页面本身都不大，但它们共用同一份 `/dashboard/*` 布局壳。
- 在前几轮性能治理后，`apps/admin` 的主 CSS 已显著下降，但共享壳仍然承担过多职责。
- 当前 `apps/admin/components/admin/protected-layout.tsx` 超过 600 行，内部同时包含导航、头部、会话菜单、移动端抽屉和 icon 实现，导致共享链路过重、后续继续做按需优化也不够顺手。

## 本次目标

- 只处理 admin 共享壳，不扩到 `web`。
- 将 `protected-layout` 收口为“状态编排 + 组合子块”的壳组件。
- 把 `Dropdown`、`Drawer` 这类较重的 UI 依赖从主壳文件中拆走，为后续继续做 route/shared chunk 优化铺路。

## 实际改动

- 新增共享壳拆分文件：
  - `protected-layout.constants.ts`
  - `protected-layout-icons.tsx`
  - `protected-layout-nav.tsx`
  - `protected-layout-sidebar.tsx`
  - `protected-layout-header.tsx`
  - `protected-layout-header-actions.tsx`
  - `protected-layout-mobile-drawer.tsx`
- `protected-layout.tsx` 改为只保留：
  - 登录态判断
  - sidebar collapsed 状态
  - mobile drawer open 状态
  - pathname 变化后的抽屉关闭逻辑
  - 顶层组合与路由级动态块装配
- 将 header actions 和 mobile drawer 挪到独立动态块，减少主壳直接引用的 HeroUI 模块集合。
- 继续做第二轮收口：
  - `ThemeModeToggle` 从 `protected-layout.tsx` 挪到动态子块 `protected-layout-header-actions.tsx`
  - 登录页、`/dashboard`、`/dashboard/publish` 这些轻页面去掉过度的 `next/dynamic` 壳层，改回直接导入
  - `protected-layout-nav.tsx` 去掉 HeroUI `Tooltip`，折叠导航退化为原生 `title`
  - `protected-layout-sidebar.tsx` 与 `protected-layout.tsx` 去掉 HeroUI `Card` / `Separator`，改为原生语义容器与轻量 utility class
- 第三轮继续压缩共享壳依赖：
  - `ThemeModeToggle` 从 HeroUI `Switch` 改为原生 `button[role=switch]` + 现有 CSS Module，移除 `@heroui/react/switch` 运行时链路
  - `protected-layout-header-actions.tsx` 去掉 HeroUI `Avatar` / `Dropdown` / `Tooltip`，改为原生按钮 + 轻量会话弹层
  - `protected-layout-mobile-drawer.tsx` 去掉 HeroUI `Drawer`，改为原生 drawer overlay + panel 实现
  - `apps/admin/app/heroui.css` 移除 `avatar.css`、`dropdown.css`、`switch.css`、`tooltip.css`、`drawer.css`

## Review 记录

- 保持 `AdminProtectedLayout` 对外接口不变，仍只接收 `children`。
- 未改后台路由结构、session API、导航元数据来源。
- `draft-editor-panel` 只做了分析判断，未在本 issue 中扩 scope。
- 本轮优先处理“共享壳负担”而不是继续下钻具体业务页，避免把 layout 优化和 `resume` / `ai` 重模块治理混在一个 issue 里。

## 遇到的问题

- 后台测试依赖大量 HeroUI mock，拆分后仍需保证原测试断言可稳定等待动态块渲染完成。
- `next/dynamic` 带来的子块异步挂载，需要在测试里从同步断言改为 `findBy*` / `waitFor` 风格，避免误报。
- `vitest run -- apps/admin/modules/workspace/__tests__/protected-layout.spec.tsx` 仍会把整个 `apps/admin` 测试套件拉起，导致 issue 外的 `draft-editor-panel` 历史波动用例继续失败；因此本轮只记录为已知噪音，不在 `issue-170` 内扩 scope 修复。

## 测试与验证

- 计划验证：
  - `pnpm --filter @my-resume/admin test`
  - `pnpm --filter @my-resume/admin typecheck`
  - `pnpm --filter @my-resume/admin build`
  - `pnpm run perf:dev:admin`
  - `pnpm run perf:build:analyze`
- 实际验证：
  - `pnpm --filter @my-resume/admin typecheck` ✅
  - `pnpm --filter @my-resume/admin build` ✅
  - `node scripts/perf-build-analyze.mjs --apps admin --output .tmp/perf/build-admin-after-shell-native.json` ✅
  - `pnpm --filter @my-resume/admin test -- apps/admin/modules/workspace/__tests__/protected-layout.spec.tsx`
    - `modules/workspace/__tests__/protected-layout.spec.tsx` 4 个用例通过
    - 但命令会额外带出 `modules/resume/__tests__/draft-editor-panel.spec.tsx` 两个既有失败用例，属于当前 issue 外的历史噪音
- 关键结果：
  - `Route (app) /dashboard` `First Load JS` 维持在 `125 kB`
  - `Route (app) /dashboard/ai` `First Load JS` 维持在 `124 kB`
  - `Route (app) /dashboard/publish` `First Load JS` 维持在 `133 kB`
  - `apps/admin/.next/app-build-manifest.json` 中 `/dashboard/layout` 关联文件数从此前的 `13` 下降到 `9`
  - 最新分析报告位于 `.tmp/perf/build-admin-after-shell-native.json`
- 第三轮追加验证：
  - `pnpm --filter @my-resume/admin exec vitest run modules/shared/__tests__/theme-mode-toggle.spec.tsx modules/workspace/__tests__/protected-layout.spec.tsx` ✅
  - `pnpm --filter @my-resume/admin build` ✅
  - `pnpm --filter @my-resume/admin typecheck` ✅
  - `node scripts/perf-build-analyze.mjs --apps admin --output .tmp/perf/build-admin-after-native-header-and-drawer.json` ✅
  - 对比 `build-admin-after-shell-native.json`：
    - admin 总静态体积 `1468.34 KiB` → `1395.81 KiB`（`-72.53 KiB`）
    - admin 主 CSS `146.21 KiB` → `118.77 KiB`（`-27.44 KiB`）
  - `next build` 结果：
    - `/` `First Load JS` `137 kB` → `135 kB`
    - `/dashboard/publish` `133 kB` → `132 kB`
    - `/dashboard/resume` `121 kB` → `120 kB`

## 后续可写成教程/博客的切入点

- Next App Router 后台壳为什么会拖累多个小路由首屏。
- 如何用“壳组件 + 动态子块”方式逐步拆重 UI 依赖。
- 为什么性能治理里要先做共享链路收口，再做具体工作区页面拆分。

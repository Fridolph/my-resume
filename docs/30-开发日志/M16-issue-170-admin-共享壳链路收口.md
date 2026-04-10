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

## Review 记录

- 保持 `AdminProtectedLayout` 对外接口不变，仍只接收 `children`。
- 未改后台路由结构、session API、导航元数据来源。
- `draft-editor-panel` 只做了分析判断，未在本 issue 中扩 scope。

## 遇到的问题

- 后台测试依赖大量 HeroUI mock，拆分后仍需保证原测试断言可稳定等待动态块渲染完成。
- `next/dynamic` 带来的子块异步挂载，需要在测试里从同步断言改为 `findBy*` / `waitFor` 风格，避免误报。

## 测试与验证

- 计划验证：
  - `pnpm --filter @my-resume/admin test`
  - `pnpm --filter @my-resume/admin typecheck`
  - `pnpm --filter @my-resume/admin build`
  - `pnpm run perf:dev:admin`
  - `pnpm run perf:build:analyze`

## 后续可写成教程/博客的切入点

- Next App Router 后台壳为什么会拖累多个小路由首屏。
- 如何用“壳组件 + 动态子块”方式逐步拆重 UI 依赖。
- 为什么性能治理里要先做共享链路收口，再做具体工作区页面拆分。

# M16 / issue-171：web + admin 接入 next-intl 双语路由与 Provider 收口

## 背景

- 当前仓库已经有 `zh/en` 双语诉求，但实现长期依赖分散的 `locale` 分支与局部常量映射，扩展成本高。
- `apps/web` 与 `apps/admin` 均缺少统一的 locale 路由前缀和中间件治理，`<html lang>` 与 HeroUI locale 也没有统一从路由注入。
- 本轮目标是先把 i18n 基础设施打牢：统一路由、统一 Provider、统一导航能力，再逐步扩展模块文案覆盖。

## 本次目标

- 在 `apps/web` 与 `apps/admin` 同步落地 `next-intl`（App Router 模式）。
- 路由改为显式 locale 前缀：`/zh/*`、`/en/*`。
- 将当前 locale 注入到 HTML `lang` 与 HeroUI i18n Provider。
- 保持服务端 API、DTO、业务行为不变，只做前端路由与文案治理基础设施升级。

## 实际改动

- `web/admin` 两端新增 i18n 基础文件：
  - `i18n/routing.ts`
  - `i18n/navigation.ts`
  - `i18n/request.ts`
  - `i18n/messages.ts`
  - `middleware.ts`
- `next.config.ts` 两端都接入 `next-intl/plugin`，并指向各自 `i18n/request.ts`。
- App Router 改为 `app/[locale]/...`：
  - `apps/web`：`/[locale]`、`/[locale]/profile`、`/[locale]/ai-talk`
  - `apps/admin`：`/[locale]`、`/[locale]/dashboard/*`
- 根布局统一 locale 注入：
  - `web/admin` 根布局按当前 locale 设置 `<html lang>`（`zh-CN` / `en-US`）。
  - 两端 Provider 链路接入 HeroUI `I18nProvider`（基于当前 `@heroui/react@3.0.1` 能力）。
- 导航能力切到 locale-aware 包装：
  - 两端关键组件改为使用 `i18n/navigation` 的 `Link/useRouter/usePathname`。
  - 保留原有页面行为，但跳转和链接统一带 locale 上下文。
- 模块化文案首轮接入：
  - `apps/web/modules/site/i18n/{zh,en}.json`
  - `apps/admin/modules/{workspace,auth,publish,ai}/i18n/{zh,en}.json`
- 性能脚本路径同步更新：
  - 根 `package.json` 中 `perf:dev:web`、`perf:dev:admin` 改为访问 `/zh/*` 前缀路径。

## Review 记录

- 本轮严格保持边界：不改 server API、不改 DTO、不改 admin 会话模型、不改页面业务职责。
- `@heroui/react` 当前版本无 `HeroUIProvider` 导出，因此按兼容方案使用 `I18nProvider` 注入 locale。
- 保持模块自治方向：文案优先放在模块内 `i18n`，通过 app 级聚合加载，不回退到全局大字典。

## 遇到的问题

- 迁移到 locale-aware `Link` 后，测试中的自定义 mock 会把 `prefetch={false}` 透传到原生 `<a>`，出现非阻塞警告（不影响通过）。
- admin 历史逻辑仍有 locale cookie fallback，本轮改为“路由 locale 优先，cookie 兼容兜底”模式，避免与新路由前缀割裂。

## 测试与验证

- `pnpm --filter @my-resume/web typecheck` ✅
- `pnpm --filter @my-resume/web test` ✅
- `pnpm --filter @my-resume/web build` ✅
- `pnpm --filter @my-resume/admin typecheck` ✅
- `pnpm --filter @my-resume/admin test` ✅
- `pnpm --filter @my-resume/admin build` ✅
- `pnpm --filter @my-resume/server typecheck` ✅
- `pnpm --filter @my-resume/server test` ✅
- `pnpm test:workspace` ✅
- `pnpm run perf:build:analyze` ✅

## 结果观察

- 构建输出已切换到 locale 前缀路由：
  - web：`/[locale]`、`/[locale]/profile`、`/[locale]/ai-talk`
  - admin：`/[locale]`、`/[locale]/dashboard/*`
- perf 分析报告已更新：`.tmp/perf/build-report.json`。
- 引入 i18n 基础设施后，构建与类型/单测链路保持稳定通过。

## 后续可写成教程/博客的切入点

- Next App Router 下，如何用 `next-intl` 做“路由前缀 + Provider + locale-aware navigation”一体化接入。
- 在不改后端契约的前提下，把多语言治理从“散落分支”平滑升级到“模块字典 + 统一路由”。
- HeroUI 版本差异（`HeroUIProvider` vs `I18nProvider`）下的兼容接入策略。

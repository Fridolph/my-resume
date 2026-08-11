# M50 Issue #270：统一 web 与 admin 暗色主题可读性与壳层风格

- Issue：#270
- 里程碑：M50
- 分支：`fix/m50_270__dark-theme-contrast`
- 日期：2026-08-10

## 背景

公开站和后台在暗色模式下出现浅色 utility、浅色 token 与深色页面基底混用的问题。表象是标题、卡片和壳层无法稳定呈现浅色文字与深色表面，而 light 模式已经符合预期。

## 本次目标

- 只修复 web/admin 的主题样式入口和 token 识别范围。
- 保持既有 light 模式视觉、业务逻辑、接口与页面结构不变。
- 为重复 Tailwind 入口和 admin `.dark` token 增加回归保护。

## 根因与实际改动

### Web

`8f5448a` 为修复 Tailwind v4 响应式问题，把多个按需加载的组件 CSS 改为 `@import "tailwindcss"`。局部文件因此生成了不继承根 `data-theme` dark variant 的 utility 输出，并在运行时覆盖了根入口的主题规则。

- 保持 `apps/web/app/globals.css` 作为唯一 Tailwind 主入口。
- 移除 4 个纯组件 CSS 的重复 Tailwind 导入。
- AI Talk 的局部 CSS 需要 `@apply`，改用 `@reference "../../../globals.css"` 获取编译上下文而不输出第二套 utility。

### Admin

`admin-shell.css` 同时重复导入 Tailwind 和 `display.css`。admin 使用 `html.dark`，而共享 display token 仅识别 `html[data-theme='dark']`，导致 display 相关卡片持续使用浅色 token。

- `admin-shell.css` 保留 `display.css` 的既有加载顺序，避免 light 模式视觉漂移。
- `admin-shell.css` 改用 `@reference './globals.css'` 处理 `@apply`，不再重复输出 Tailwind。
- `packages/ui/src/display.css` 同时支持 `html.dark`，使 admin 的共享 display token 正确进入深色值。

## Review 记录

- 改动仅覆盖 CSS 入口、共享 display token、主题入口测试和既有白字断言，符合 Issue #270 范围。
- 未新增依赖、接口、数据模型或新的主题切换机制。
- 先放弃过“将 display.css 移到全局入口”的方案：它会改变 light 模式的 token 覆盖顺序，不满足本次保持 light 现状的边界。

## 测试与验证

- `pnpm --filter @my-resume/web exec vitest run 'app/__tests__/theme-style-entry.spec.ts' 'app/[locale]/_resume/__tests__/shell.spec.tsx'`：14 passed。
- `pnpm --filter @my-resume/admin exec vitest run 'app/__tests__/theme-style-entry.spec.ts' 'app/[locale]/dashboard/_shared/__tests__/protected-layout.spec.tsx'`：7 passed。
- `pnpm --filter @my-resume/ui exec vitest run`：15 passed。
- `pnpm --filter @my-resume/web typecheck`：通过。
- `pnpm --filter @my-resume/admin typecheck`：通过。
- 本地运行态烟测：`/login` 与 `/zh/ai-talk` 均返回 HTTP 200，局部样式已由 Turbopack 编译。
- 完整 `next build`：本机已有 `next dev` 占用两端 `.next` 目录，收集页面数据时出现 `PageNotFoundError: /_document`；未停止正在使用的本地服务，待服务停掉后补跑。

## 后续可沉淀点

- Tailwind v4 中 `@import`、`@reference` 与按需 CSS 的边界。
- 单仓库多主题实现中，统一 `data-theme` 与 `.dark` selector 兼容的策略。

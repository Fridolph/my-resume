# M16 / issue-169：web 技能区延后加载与首页主链路收口

## 背景

- 公开站前几轮优化后，技能区图表已经具备懒加载边界，但首页、`/profile`、`/ai-talk` 仍共用一条偏重的共享头部交互链路。
- 构建结果里最显眼的大块仍然是技能图表相关懒加载 chunk，但它并不直接进入 `/` 首屏主链；真正还值得继续下手的是 `site/header` 对 `Dropdown`、`Switch` 等交互组件的同步依赖。

## 本次目标

- 保持公开站视觉和交互不变。
- 将 header 中的“下载菜单 / 主题切换 / GitHub 按钮”拆成独立动态子块。
- 继续压低 `/`、`/profile`、`/ai-talk` 的 `First Load JS`。

## 实际改动

- 新增 `apps/web/modules/site/public-site-header-actions.tsx`：
  - 承接下载菜单
  - 承接主题切换
  - 承接 GitHub 按钮
- `apps/web/modules/site/header.tsx` 改为只保留：
  - 品牌区
  - 主导航
  - 语言切换
  - 动态加载的 actions 子块入口
- 为动态加载态补了最小 skeleton 样式：
  - `headerActionSkeleton`
  - `themeSwitchSkeleton`
- 调整 `PublishedResumeShell` 相关测试，改为等待 header 动态动作区稳定挂载后再断言 dropdown / switch / GitHub 按钮。

## Review 记录

- 未改公开站路由、API、DTO、主题逻辑。
- 433KB 的 `179.*.js` 仍保留，但已确认它主要来自技能图表懒加载块，不属于首页首屏主链。
- 本轮收益重点在共享 header 主链收口，而不是继续追求把图表懒加载 chunk 做到极限最小。

## 测试与验证

- `pnpm --filter @my-resume/web typecheck` ✅
- `pnpm --filter @my-resume/web test` ✅
- `pnpm --filter @my-resume/web build` ✅

## 构建结果

- `Route (app) /` 的 `First Load JS` 下降到约 `184 kB`
- `Route (app) /profile` 的 `First Load JS` 下降到约 `139 kB`
- `Route (app) /ai-talk` 的 `First Load JS` 下降到约 `139 kB`
- `app-build-manifest` 中：
  - `/profile/page` 文件数从 `8` 降到 `7`
  - `/ai-talk/page` 文件数从 `8` 降到 `7`

## 后续可写成教程/博客的切入点

- 为什么“共享头部交互链路”也会拖累多个公开页面的首屏体积。
- 如何把 HeroUI 的高交互组件从共享主链拆成动态子块，同时保持测试稳定。
- 为什么性能优化不能只盯最大 chunk，还要区分“首屏主链”和“懒加载块”。

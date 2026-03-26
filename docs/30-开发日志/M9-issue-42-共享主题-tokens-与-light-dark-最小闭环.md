# M9 / issue-42 开发日志：共享主题 tokens 与 light / dark 最小闭环

- Issue：#76
- 里程碑：M9 体验基线与主题边界：从可用到可继续设计
- 分支：`fys-dev/feat-m9-issue-42-theme-foundation`
- 日期：2026-03-26

## 背景

进入 M9 之前，`web / admin` 已经具备最小可用页面壳，但主题能力仍存在两个问题：

- `web` 自己维护一套 `light / dark` 变量与切换逻辑
- `admin` 还没有统一主题切换入口

如果继续在这种状态下做后台体验整理和公开页视觉升级，主题判断、变量和切换逻辑会再次散落，后续无论是做共享 UI 还是多模板扩展都会越来越难收口。

## 本次目标

- 为 `web / admin` 建立统一主题基线
- 把 `light / dark` 切换能力上收到 `packages/ui`
- 让主题选择在刷新后保持
- 保持当前范围只解决主题边界，不进入多模板和大规模 UI 改版

## 非目标

- 不做多模板主题系统
- 不跟随系统主题（`system`）
- 不做 Figma 级视觉精修
- 不顺手扩展新的业务功能

## TDD / 测试设计

本次采用“先锁定共享主题行为，再验证双应用接入”的测试思路。

### 1. 共享主题工具测试

新增：

- `packages/ui/src/theme.spec.ts`

验证：

- 非法主题值会被规范化为 `light`
- 主题值可读写本地存储
- 主题切换会同步到 `document.documentElement`

### 2. 使用侧切换测试

补充：

- `apps/web/components/published-resume-shell.spec.tsx`
- `apps/admin/components/theme-mode-toggle.spec.tsx`

验证：

- `web` 中点击主题切换按钮后，文档根节点主题值会变化
- 切换结果会落到 `localStorage`
- `admin` 也能复用同一套共享主题入口

### 3. 工程级验证

执行：

- `pnpm --filter @my-resume/ui test`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/admin test`
- `pnpm typecheck:all`
- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/admin build`

这样做的重点不是单纯证明“按钮能点”，而是证明“共享主题入口、切换持久化与双应用接入”三件事都成立。

## 实际改动

### 1. 把主题基线收口到 `packages/ui`

新增：

- `packages/ui/src/theme.tsx`
- `packages/ui/src/theme.spec.ts`
- `packages/ui/tsconfig.json`
- `packages/ui/vitest.config.ts`

更新：

- `packages/ui/package.json`
- `packages/ui/src/display.css`
- `packages/ui/README.md`

这一步把主题相关职责拆成两层：

- `display.css` 负责统一主题 tokens 与深浅色变量
- `theme.tsx` 负责 provider、状态管理、`localStorage` 持久化与根节点同步

这样后续 `web / admin` 都只接共享主题入口，而不再各自维护一套切换状态。

### 2. 让 `web / admin` 正式依赖 `@my-resume/ui`

更新：

- `apps/web/package.json`
- `apps/admin/package.json`
- `apps/web/next.config.ts`
- `apps/admin/next.config.ts`
- 根目录 `package.json`

本次没有继续沿用相对路径引入状态逻辑，而是把 `@my-resume/ui` 正式接成 workspace 依赖，并补到测试与构建链路里。这样后续在共享展示组件和共享主题继续演进时，边界会更稳定。

### 3. `web` 主题切换从页面内部状态改为共享 provider

更新：

- `apps/web/app/layout.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/published-resume-shell.tsx`
- `apps/web/components/published-resume-shell.spec.tsx`
- `apps/web/components/published-resume/published-resume-hero.tsx`
- `apps/web/components/published-resume/published-resume-utils.ts`

本次把原来只在 `PublishedResumeShell` 内部维护的主题状态上移到应用层，由 `ThemeModeProvider` 统一提供，页面本身只保留“切换 UI”和“读取当前主题值”的职责。

同时，`web` 原先自有的一大段深浅色变量被删掉，改为直接消费共享 `display.css` 中的 tokens。

### 4. `admin` 补齐最小主题切换闭环

新增：

- `apps/admin/components/theme-mode-toggle.tsx`
- `apps/admin/components/theme-mode-toggle.spec.tsx`

更新：

- `apps/admin/app/layout.tsx`
- `apps/admin/app/globals.css`
- `apps/admin/components/admin-login-shell.tsx`
- `apps/admin/components/admin-dashboard-shell.tsx`

这一步没有去做完整后台视觉改版，而是只给 `admin` 补最小主题切换入口，并把原本写死的亮色变量替换为共享主题 tokens。

这保证了后续进入 `issue-43` 做信息架构整理时，主题基线已经成立，不需要边做布局边补主题底座。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只处理：

- 共享主题入口
- `light / dark` 切换
- 主题持久化
- 双应用接入

没有越界去做：

- 多模板系统
- 更复杂的共享组件库
- 后台信息架构重写
- 公开页视觉精修

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

有三点沉淀：

- `ThemeModeProvider / useThemeMode`
- `normalizeThemeMode / readStoredTheme / writeStoredTheme / applyThemeToDocument`
- 共享的 `toggle-button / toolbar-group` 主题切换样式

这些能力后续可以继续被 `issue-43 / issue-44 / issue-45` 直接复用。

### 本次最重要的边界判断

本次没有为了“看起来主题切换完成”去顺手做完整视觉升级，而是刻意把目标收窄为：

- 先让主题基线成立
- 再让后续展示层任务在这个基线上继续演进

这一点很关键。对于教程型项目来说，先把入口收住，比一次性把视觉铺满更重要。

### 关于 review-ready 前关键通路校验

本轮先补了本地关键通路校验记录，再决定是否进入 `review-ready`。这次复核的价值在于：判断视角已经从“文件清单”转到“主承诺兑现”。

当前确认成立的主线包括：

- 主题基线已经收敛到共享层
- 切换结果已经进入统一状态与持久化层
- `web / admin` 的接入没有破坏类型、测试与构建

后续进入更偏展示层的 M9 issue 时，还可以继续长出“展示连续通路 / 视觉基线通路”，但本轮先不扩张。

## 自测结果

已执行：

- `pnpm --filter @my-resume/ui test`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/admin test`
- `pnpm typecheck:all`
- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/admin build`

结果：全部通过。

补充说明：

- `web / admin` 构建时仍有现存 Tailwind `content` 配置告警，但这不是本轮引入的问题，当前不影响功能与构建结果。

## 遇到的问题

### 1. `web` 先前已经有主题切换，但逻辑只停留在页面内部

问题：

如果继续沿用页面级局部状态，`admin` 后续接入主题时会再次复制一套近似逻辑。

处理：

- 把状态逻辑上收到 `packages/ui`
- 页面只保留切换 UI 和当前主题读取

### 2. 共享主题包原本还不是正式 workspace 依赖

问题：

之前 `display.css` 通过相对路径直接导入，样式能用，但主题状态逻辑没有稳定共享入口。

处理：

- 让 `@my-resume/ui` 正式接入 `web / admin`
- 同步补上 typecheck / test / build 入口

## 可沉淀为教程/博客的点

- 为什么主题能力要先做“共享基线”，而不是直接做多模板
- 展示型项目里，主题状态为什么不能只停留在某个页面组件内部
- monorepo 中什么时候该把“能用的相对路径共享”升级为正式 workspace 包依赖
- `review-ready` 前的关键通路校验，如何把“测试通过”再往“主承诺兑现”推进半层

## 后续待办

- 推进 `M9 / issue-43`：admin 后台信息架构与仪表盘壳整理
- 推进 `M9 / issue-44`：web 公开简历页视觉基线升级
- 推进 `M9 / issue-45`：抽离最小共享展示组件
- 在后续更偏展示层的 issue 中，逐步补充“展示连续通路 / 视觉基线通路”类证据

# M20-issue-177：admin + web HeroUI 样式基线收敛

- Issue：M20 / admin + web HeroUI 样式基线收敛
- 里程碑：M20
- 分支：`development`
- 日期：2026-04-16

## 背景

近期 `admin` 与 `web` 已经逐步切到 HeroUI，但运行时样式仍混入了较多“二次上色”与全局标签覆盖。最明显的问题是：

- `apps/admin/app/globals.css` 直接重写了 `input / select / textarea` 的边框、背景与内边距，和 HeroUI 表单组件内部结构叠加后，容易出现双层 border / background / padding。
- `packages/ui/src/heroui-web.css` 没有跟上 `web` 侧实际使用的 HeroUI 组件，`Skeleton` 已用但样式未完整导入，页面只能依赖额外 class 强撑视觉。
- `admin` 里的部分 `Button / CloseButton` 又手写了一层完整壳体，和 HeroUI 自带 surface 形成双层视觉系统。

## 本次目标

- 收紧 `admin` 全局样式，移除会直接命中 HeroUI 内部 DOM 的高风险裸标签覆盖。
- 补齐 `web` 当前实际使用到的 HeroUI 组件样式入口。
- 优先清理 `admin` 中明显重复承担边框、背景、hover 壳体职责的按钮类常量。
- 保留现有品牌感与语义色，不做新一轮视觉 redesign。

## 非目标

- 不改 API、DTO 或任意后端行为。
- 不整体重画 `admin` / `web` 页面视觉。
- 不趁机大面积替换所有 `Card` 的样式语言，只处理当前已确认的 HeroUI 基线冲突点。

## TDD / 测试设计

- 为 `packages/ui/src/heroui-web.css` 新增定向测试，确保 `Skeleton` 样式导入不会再次缺失。
- 保留 `admin` 头部布局相关测试，收口断言到 HeroUI 语义类，而不是继续绑死旧的手写 danger 外观。
- 继续执行 `admin` / `web` typecheck，确认样式调整没有引发组件类型回归。

## 实际改动

- 移除 `apps/admin/app/globals.css` 对 `input / select / textarea` 的全局边框、背景、padding、focus ring 和移动端尺寸覆盖，仅保留安全的 `font: inherit` 与通用禁用态。
- 在 `packages/ui/src/heroui-web.css` 中补入 `@heroui/styles/components/skeleton.css`，并新增 `packages/ui/src/heroui-web.spec.ts` 保护这条依赖。
- 收敛 `apps/admin/app/_shared/ui/components/heroui/admin-action-icon-button.tsx` 的按钮壳体，改为更多依赖 HeroUI 自身 variant / state，只保留尺寸、圆角、颜色与 focus ring。
- 收敛 `apps/admin/app/[locale]/dashboard/_shared/components/protected-layout.constants.ts` 中顶部、侧边栏、头像、退出登录与移动端关闭按钮的 class，移除重复的整套 border / bg / hover 壳层。
- 将 `apps/admin/app/[locale]/dashboard/_shared/components/protected-layout-header-actions.tsx` 的退出登录按钮切到 HeroUI `variant="danger"`，避免继续靠手写红底撑视觉。
- 收敛 `apps/admin/app/[locale]/dashboard/resume/_resume/editor/editor-primitives.tsx` 中确认弹层和图标按钮的二次外观覆盖。
- 清理 `apps/web/app/_shared/site/site-header.tsx` 与 `apps/web/app/_shared/published-resume/published-resume-loading-state.tsx` 上给 `Skeleton` 额外加的背景、边框壳层，仅保留尺寸与圆角。

## Review 记录

- 本轮主要命中“全局标签覆盖”和“HeroUI 组件二次上色”两个明确根因，范围控制在计划内，没有扩成全站 UI 重画。
- `admin` 侧优先治理按钮类常量而不是逐页清扫，便于后续继续把 HeroUI 语义收敛到共享入口。
- `web` 侧只处理已确认的样式缺口与骨架屏重复壳层，没有改动已经稳定的公开站渐变语言。

## 自测结果

- `pnpm --filter @my-resume/ui test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/web typecheck`
- `pnpm --filter @my-resume/admin exec vitest run 'app/[locale]/dashboard/_shared/__tests__/protected-layout.spec.tsx' 'app/_shared/ui/__tests__/theme-mode-toggle.spec.tsx'`
- `pnpm check:tsx-types`

## 遇到的问题

- HeroUI `Button` 的危险语义切回 `variant="danger"` 后，旧测试里对手写 `bg-rose-*` 类的断言失效，需要改为断言 `button--danger` 这一类库语义 class。
- 一些页面之前为了弥补 `Skeleton` 样式缺失，已经在调用侧补了边框和背景；补齐 CSS import 后要同步删掉这些补丁类，才能真正避免双层背景。

## 可沉淀为教程/博客的点

- 为什么“全局给 `input / textarea` 上样式”在接入组件库后会迅速变成样式债。
- 如何在不重画产品视觉的前提下，把现有页面逐步收敛回 HeroUI 的语义 variant。
- 如何通过样式入口测试，避免出现“组件已经用了，但 CSS 没导进来”的隐性回归。

## 后续待办

- 若后续确认某些 `Card` 仍存在双层 surface，可再单开 issue 做按页面收口，而不是在本轮继续扩范围。
- 当 `admin` 的主按钮语义进一步稳定后，可再评估是否把 `_core/button-styles.ts` 里的品牌 token 继续往更轻量的共享层收缩。

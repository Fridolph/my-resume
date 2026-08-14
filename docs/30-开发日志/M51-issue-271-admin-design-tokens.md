# M51 / issue-271 开发日志：建立 Admin Design Tokens 与主题契约

- Issue：#271
- 里程碑：M51 Admin 设计系统与布局样式重构
- 分支：`feat/m51_1__admin-design-tokens`
- 日期：2026-08-11

## 背景

admin 当前已经有一组 `--admin-*` 和 `--display-*` 变量，但定义集中在 `globals.css`，同时存在直接色值、旧别名和共享展示 token。随着壳层与功能模块继续做视觉重构，这种混用会让 light / dark 的改动难以定位，也容易继续复制冗余样式。

## 本次目标

- 建立 admin 的 primitive、semantic、component 三层 token 结构。
- 固化 `light / dark` 主题契约，并让 admin 壳层导入顺序稳定。
- 保留当前样式引用使用的兼容别名，为后续按 Issue 逐步迁移页面提供过渡期。

## 非目标

- 不修改 admin 布局、导航或业务模块结构。
- 不改变 HeroUI 组件行为、接口、数据库、路由和环境变量。
- 不在本 Issue 内批量替换业务 TSX 中的 zinc / arbitrary utility。

## TDD / 测试设计

在 `apps/admin/app/__tests__/theme-style-entry.spec.ts` 中锁定：

- admin shell 同时加载 Tailwind、共享 display 样式和 admin token 入口。
- globals 与 admin shell 都能引入 token 入口。
- token 文件包含三层定义、dark 主题选择器和旧变量兼容别名。

## 实际改动

- 新增 `apps/admin/app/admin-tokens.css`，集中维护 admin token 契约。
- 将 `globals.css` 中原有的 admin / display 变量迁移到 token 文件。
- 在 admin shell 中于 `display.css` 之后重新引入 token 文件，确保 admin 语义值覆盖共享展示默认值。
- 修正壳层两处 `border-[--admin-*]` 的无效 Tailwind arbitrary value 写法，统一为 `border-[color:var(--admin-*)]`。
- 更新主题样式入口测试，防止后续再次遗漏 token 入口或破坏兼容层。

## Review 记录

- 改动范围限定在主题样式入口、token 定义和对应测试/日志，未触及业务组件。
- 未新增 npm 依赖，未改变现有 token 名称的调用方。
- 后续模块迁移应优先使用 `--admin-color-*` 语义变量，待迁移完成后再删除兼容别名。

## 自测结果

已通过：

- `pnpm --filter @my-resume/admin exec vitest run app/__tests__/theme-style-entry.spec.ts`：3/3。
- `pnpm --filter @my-resume/admin typecheck`。
- `pnpm --filter @my-resume/admin build`，生产 CSS 产物包含 light / dark token 契约。
- `git diff --check`。
- `oxfmt` 已格式化本次涉及的 CSS 与测试入口文件；聚焦主题入口测试在格式化后仍为 3/3 通过。

已知测试基线：

- 全量 `pnpm --filter @my-resume/admin test` 中 16/19 个测试文件通过，3 个既有组件测试因可访问名称断言与当前 DOM 不一致失败，共 7 个用例；本分支未修改对应 TSX，按 Issue 边界不在此处修复。
- `pnpm --filter @my-resume/admin lint` 仍有 8 个既有 error、13 个 warning，集中在 AI 工作台、简历导入和 RAG 模块的 hooks 依赖、未使用变量与测试属性；本分支未触及这些文件。
- 本地浏览器人工回归被执行环境拒绝访问 `http://127.0.0.1:5566`，因此需要在合并前由本机手动确认 login / dashboard 的 light、dark 和移动端视图。

## 后续教程切入点

可将本次“先建立 token 契约，再按 Issue 逐模块迁移”的过程整理为后台渐进式 Design System 重构案例。

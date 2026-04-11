# M16 Follow-up：`apps/web` 模块自治重组

## 背景

- `apps/admin` 已切到 `modules + core` 结构后，`apps/web` 仍停留在 `components + lib` 的旧分层。
- 公开站虽然模块数量不多，但 `published-resume`、`profile`、`ai-talk`、`site` 的边界已经逐渐清晰，继续混放在全局 `components` / `lib` 中，后续做性能治理和教程讲解都不够直观。

## 本次目标

- 将 `apps/web` 收口为 `app + core + modules` 结构。
- 让每个 web feature 按模块维护自己的 `README.md`、`__tests__/`、`types/` 与业务实现。
- 不改页面路由、不改 DTO、不改现有公开站行为。

## 实际改动

- 新增 `apps/web/core/`，将环境变量读取迁到 `core/env.ts`。
- 新增 `apps/web/modules/`，并按业务拆成：
  - `published-resume`
  - `profile`
  - `ai-talk`
  - `site`
- `published-resume` 模块内收：
  - 已发布简历读取服务
  - 公开简历 shell
  - 各 section 组件
  - 图表工具与模块类型
  - 相关测试夹具与测试文件
- `profile`、`ai-talk`、`site` 分别维护自己的壳组件、测试目录和模块 README。
- 根脚本 `pnpm check:tsx-types` 继续沿用轻量校验，但现在也会优先识别 `apps/web/modules/**` 的模块内 `types/`。

## Review 记录

- `app/page.tsx`、`/profile`、`/ai-talk` 只改 import 落点，不改数据读取与渲染逻辑。
- `published-resume` 相关类型不再留在全局 `lib`，统一回到模块内维护。
- `site` 模块只承接公开站共享头部，不顺手吸收 `published-resume` 的业务 section。

## 遇到的问题

- 之前几轮 `web` 性能优化已经让不少文件处于修改中，做目录迁移时必须先保证路径更新干净，否则很容易把“功能改动”和“路径改动”混在一起。
- `published-resume` 是公开站事实上的主模块，`profile` / `ai-talk` 都依赖它的类型与文案工具，因此本轮保持显式跨模块 import，不引入 barrel。

## 测试与验证

- 计划验证：
  - `pnpm --filter @my-resume/web test`
  - `pnpm --filter @my-resume/web typecheck`
  - `pnpm --filter @my-resume/web build`
  - `pnpm check:tsx-types`

## 后续可写成教程/博客的切入点

- 为什么前台公开站也值得做“模块自治”，而不只是后台系统。
- 从 `components + lib` 迁到 `modules + core` 时，如何保持依赖关系清晰可读。
- 为什么在 feature 迁移阶段坚持显式 import，比先上 barrel 更容易教学与排错。

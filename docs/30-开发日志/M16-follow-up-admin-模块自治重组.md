# M16 Follow-up：Admin 模块自治重组

## 背景

- 之前 `apps/admin` 主要按 `components/` 与 `lib/` 横向拆分，阅读时需要同时在多个目录来回跳转。
- 即便完成了 `.types.ts` 命名收口，`resume`、`ai`、`auth`、`publish` 等业务的类型、测试、组件、API 仍然没有形成真正的模块边界。
- 这不利于后续继续拆性能 issue，也不利于把 admin 侧整理成教程型、可讲解的 feature module 结构。

## 本次目标

- 把 `apps/admin` 调整为 `modules/ + core/` 双层结构。
- 让每个业务模块自己维护 `README.md`、`__tests__/`、`types/` 和实现文件。
- 保持现有页面路由、接口契约和业务行为不变，只整理结构与导入边界。

## 实际改动

- 新增 `apps/admin/modules/`，按业务收口为：
  - `resume`
  - `ai`
  - `auth`
  - `publish`
  - `workspace`
  - `shared`
- 新增 `apps/admin/core/`，承接跨模块基础设施：
  - `env`
  - `session-storage`
  - `admin-session`
  - `admin-session-store`
  - `admin-resource-store`
  - `button-styles`
- `resume` 模块保留并升格之前已经拆出的：
  - `sections/`
  - `hooks/`
  - `editor/`
  - `types/`
  - `services/`
  - `utils/`
- `ai / auth / publish / workspace / shared` 也同步补齐本地模块目录和模块 README。
- `workspace` 额外新增 `types/admin-navigation.types.ts`，把导航类型从 utils 中显式抽离到模块自己的类型目录。
- `scripts/check-tsx-types.mjs` 升级为优先检查 `apps/admin/modules/<feature>/types/`。
- `AGENTS.md` 补充 admin 模块自治与模块内 `types/` 约定。

## Review 记录

- 本轮没有继续走“全局 `lib/types/` 收纳箱”路线，因为那样只是把类型集中存放，并不能形成业务模块边界。
- 采用 `modules/ + core/` 的原因：
  - 模块目录能直接表达职责
  - 页面入口更薄，业务归属更清楚
  - 后续拆分性能、测试、文档时更容易局部推进
- `core/` 只保留跨模块能力，避免再次退回“大杂烩 lib”。

## 遇到的问题

- 上一轮已经先做了 `resume` 内部 `sections/hooks/editor/types` 拆分，这次继续升格为 feature module 时，需要二次调整大量相对 import。
- 测试里的 `vi.mock()` 与 `typeof import()` 路径也必须同步迁移，否则很容易漏掉。

## 测试与验证

- 计划验证：
  - `pnpm --filter @my-resume/admin test`
  - `pnpm --filter @my-resume/admin typecheck`
  - `pnpm --filter @my-resume/admin lint`
  - `pnpm check:tsx-types`
  - `pnpm test:workspace`

## 后续可写成教程/博客的切入点

- 为什么仅把类型挪到 `types/` 目录还不够，真正重要的是“模块自治边界”。
- 如何把已有的 `components + lib` 项目逐步迁成 `modules + core`，又不一次性重写整个后台。
- 为什么 `workspace`、`resume`、`ai` 这些模块拆开后，更利于后续性能优化和教学演示。

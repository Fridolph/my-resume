# M8 / issue-41 开发日志：Jest 迁移到 Vitest

- Issue：#70
- 里程碑：M8 数据持久化与共享契约：从内存态到可持续演进
- 分支：`fys-dev/feat-m8-issue-41-vitest-migration`
- 日期：2026-03-26

## 背景

当前仓库的测试基建并不统一：

- `apps/admin` 与 `apps/web` 已经使用 `Vitest`
- `apps/server` 仍然停留在 `Jest`

随着 monorepo 持续推进，这种双栈测试体验会让文档、脚本、依赖和 CI 说明越来越分裂。因此这次任务的目标，是把 `server` 也切到 `Vitest`，让仓库的测试主线保持一致。

## 本次目标

- 将 `apps/server` 的单测与 E2E 从 `Jest` 切换到 `Vitest`
- 移除 `Jest` 相关依赖与配置
- 保持现有测试文件语义和命令入口尽量稳定
- 补充测试策略文档

## 非目标

- 不新增业务测试场景
- 不改造 Playwright 或其他前端 E2E
- 不顺带重写现有测试结构

## TDD / 测试设计

这次迁移的核心不是补新测试，而是用现有测试保护迁移行为：

### 1. `server` 单测

验证：

- `pnpm --filter @my-resume/server test`

### 2. `server` E2E

验证：

- `pnpm --filter @my-resume/server test:e2e`

### 3. 工程级验证

验证：

- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`
- `pnpm test:unit`
- `pnpm test:e2e`

这样做的重点是：用现有回归面证明“测试框架切换没有改变业务行为”。

## 实际改动

### 1. `apps/server` 切换为 Vitest

更新：

- `apps/server/package.json`

变更包括：

- `test / test:watch / test:cov / test:debug / test:e2e` 全部改为 `Vitest`
- 移除 `jest`、`ts-jest`、`@types/jest`
- 增加 `vitest` 与 `@vitest/coverage-v8`

### 2. 新增 `server` 的 Vitest 配置

新增：

- `apps/server/vitest.config.mts`
- `apps/server/vitest.e2e.config.mts`

当前采用：

- 单测只跑 `src/**/*.spec.ts`
- E2E 只跑 `test/**/*.e2e-spec.ts`

这样可以继续保留原先“单测 / E2E 分开执行”的教学节奏。

### 3. 删除 Jest 专用配置

删除：

- `apps/server/test/jest-e2e.json`

同时清理了：

- `apps/server/eslint.config.mjs` 中的 `jest` globals

### 4. 批量迁移 `server` 测试导入

把 `apps/server` 下现有测试从：

- `@jest/globals`

迁移为：

- `vitest`

并把：

- `jest.fn`
- `jest.mock`

迁移为：

- `vi.fn`
- `vi.mock`

### 5. 为 NestJS 显式标注依赖注入

这是本次最关键的一步。

在 `Vitest` 下，`server` 测试默认走 `esbuild` 转译，而 `esbuild` 不支持 TypeScript 的 `emitDecoratorMetadata`。如果继续依赖运行时类型元数据，NestJS 的控制器和服务在测试中会出现依赖为 `undefined` 的问题。

因此本次把关键注入点改成了显式注入，例如：

- `AppController`
- `AuthController`
- `AuthDemoController`
- `AuthService`
- `JwtAuthGuard`
- `RoleCapabilitiesGuard`
- `ResumeController`
- `ResumePdfExportService`
- `AiFileController`
- `AiReportController`

这样做的好处是：

- `Vitest` 下测试稳定可跑
- 依赖来源更明确
- 后续教程里更容易解释 token / provider 的边界

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只做了测试框架与相关兼容层迁移，没有扩展到新的业务功能，也没有顺手重构已有模块逻辑。

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

有两点沉淀：

- `server` 形成了可复用的 `Vitest` 单测 / E2E 双配置模式
- `NestJS` 显式依赖注入模式在后续继续迁移模块时可直接复用

### 这次最重要的边界判断

本次没有为了“适配 Vitest”去换掉 NestJS，也没有退回 `Jest` 保守方案，而是通过显式依赖注入解决元数据缺失问题。

这符合当前项目的学习目标：既统一工具链，也把底层原理讲清楚。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server test:e2e`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`
- `pnpm test:unit`
- `pnpm test:e2e`

结果：全部通过。

## 遇到的问题

### 1. `Vitest` 下 NestJS 依赖注入失效

问题：

迁移后，控制器与服务中的依赖大量变成 `undefined`。

原因：

- `Vitest` 默认通过 `esbuild` 转译 TypeScript
- `esbuild` 不支持 `emitDecoratorMetadata`
- NestJS 无法再通过运行时类型元数据推断注入依赖

处理：

- 将关键构造函数注入改为显式 `@Inject(...)`

### 2. `server` 的 Vitest 配置在 CJS 模式下有警告

问题：

初始使用 `vitest.config.ts` 时，出现了 Vite Node API 的 CJS 警告。

处理：

- 改为 `vitest.config.mts`
- 改为 `vitest.e2e.config.mts`

## 可沉淀为教程/博客的点

- 为什么 monorepo 中应尽量统一测试框架
- NestJS 从 Jest 切到 Vitest 时，为什么依赖注入会失效
- 显式依赖注入为什么既是兼容方案，也是更适合教学的写法

## 后续待办

- 结合 CI 配置确认测试命令说明是否还需要进一步收敛
- 后续如继续引入更多 `NestJS` provider，可优先采用显式注入风格
- 若未来需要更高阶的测试速度优化，再考虑 Vitest 分片与更细粒度执行策略

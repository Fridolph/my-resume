# M6 / issue-20 测试基建

- Issue：`#28`
- 里程碑：`M6 测试、CI/CD、部署：从本地到上线`
- 分支：`feat/m6-issue-20-test-foundation`
- 日期：`2026-03-25`

## 背景

在 M1 - M5 的主业务链路已经跑通后，如果没有稳定的测试入口，后续继续重构、补教程、加 CI 时都会越来越不稳。  
所以这一轮先不追求覆盖率，而是把“现有测试能稳定执行 + 根级命令统一 + 策略文档落地”先站稳。

## 本次目标

- 修正当前前端测试基线中的不稳定点
- 提供仓库根级统一测试入口
- 明确测试分层与质量门禁

## 非目标

- 不追求满覆盖率
- 不引入复杂测试矩阵
- 不一次性补齐所有页面级 E2E

## TDD / 失败现象

### 1. `apps/admin` 全量测试入口不稳定

- 现象：`pnpm --filter @my-resume/admin test`
- 结果：失败
- 原因：`localStorage` 在当前测试环境下没有稳定实现

### 2. 根目录缺少统一测试入口

- 现状：
  - `server / web / admin` 都有各自脚本
  - 根目录还没有统一的 `test / test:ci / typecheck:all / build:all`
- 风险：后续接 GitHub Actions 时，命令入口会分散

## 实际改动

### `apps/admin`

- 在 `vitest.setup.ts` 中补充 `localStorage` 的内存实现
- 让 `session-storage.spec.ts` 能稳定执行

### 根目录

- 新增统一脚本：
  - `pnpm test`
  - `pnpm test:unit`
  - `pnpm test:e2e`
  - `pnpm test:ci`
  - `pnpm typecheck:all`
  - `pnpm build:all`
- 补充 `turbo` 根依赖，保证统一入口可直接运行
- 让 `apps/server` 也具备 `typecheck` 脚本，避免 workspace 类型检查遗漏
- 调整 `turbo` 构建产物声明，兼容 `Nest dist` 与 `Next .next`

### 文档

- 新增 `docs/20-研发流程/04-测试策略与质量门禁.md`
- 明确：
  - 当前测试分层
  - 根级命令入口
  - 当前质量门禁

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前先做的是“测试基建”而不是“更多业务功能”：

- 修正现有测试入口不稳定点
- 统一根级命令
- 补文档

没有提前进入：

- GitHub Actions
- 部署脚本
- 更复杂的测试矩阵

### Review 结论

- 通过
- 可进入自测

## 自测结果

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/web test`
- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server test:e2e`
- `pnpm test:ci`
- `pnpm typecheck:all`
- `pnpm build:all`

## 后续待办

- 继续 `issue-21`：GitHub Actions
- 再推进 `issue-22`：部署文档

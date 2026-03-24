# M1 / issue-03 共享配置占位

- Issue：`#7`
- 里程碑：`M1 基础工程：workspace 骨架初始化`
- 分支：`feat/m1-issue-03-shared-config-placeholders`
- 日期：`2026-03-24`

## 背景

`issue-02` 已完成 `apps/*` 与 `packages/*` 的目标目录占位，但 `packages/config` 目前仍只有单个说明文件。  
为了让后续共享 `tsconfig`、`eslint` 和环境变量约束能够自然演进，需要先把共享配置入口以**最小可解释**的方式落地。

## 本次目标

- 为 `packages/config` 增加最小共享配置占位文件
- 表达 `tsconfig`、`eslint`、`env` 三类共享配置职责
- 扩展验收脚本，确保这些配置骨架可验证
- 补充本次任务开发日志

## 非目标

- 不全面接入 ESLint 执行流程
- 不引入 Prettier
- 不接入真实环境变量校验库
- 不修改当前根级 Vue 项目的编译链路
- 不创建真实 `Next.js` / `NestJS` 应用

## TDD / 测试设计

- 先扩展 `scripts/check-workspace.mjs`
- 让脚本开始要求以下路径存在：
  - `packages/config/tsconfig.base.json`
  - `packages/config/eslint.base.cjs`
  - `packages/config/env/README.md`
- 先运行一次 `pnpm run test:workspace`
- 确认在共享配置文件尚未补齐前失败
- 再根据失败结果补齐最小共享配置骨架

## 实际改动

- 扩展 `scripts/check-workspace.mjs` 的共享配置验收范围
- 更新 `packages/config/README.md`
- 新增：
  - `packages/config/tsconfig.base.json`
  - `packages/config/eslint.base.cjs`
  - `packages/config/env/README.md`

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做：

- 共享配置占位文件
- 共享配置职责说明
- 与占位相关的验收脚本与开发日志

没有提前进入：

- ESLint 全量接入
- 环境变量真实校验
- 根级工程配置重构

### 是否可抽离组件、函数、skills 或其他复用能力

- 当前仍属于工程骨架阶段，没有组件抽离空间
- `scripts/check-workspace.mjs` 继续承担阶段性验收职责
- 暂无必要引入额外工具抽象

### Review 结论

- 通过
- 可进入自测

## 自测结果

### 1. TDD 首次失败

- `pnpm run test:workspace`
- 结果：失败
- 原因：缺少 `packages/config/tsconfig.base.json`

### 2. 骨架验收

- `pnpm run test:workspace`
- 结果：通过

### 3. 类型检查

- `pnpm run typecheck`
- 结果：通过

### 4. 构建验证

- `pnpm run build`
- 结果：通过
- 备注：仍存在 `tailwind.config.cjs` 的 ESM 警告，但与本次任务无关，且构建成功

## 遇到的问题

### 1. 共享配置容易不小心做成“真接入”

- 风险：如果直接把根项目改为引用共享配置，会超出当前 Issue 的“占位”边界
- 处理：本次只落地共享配置文件与职责说明，不改现有编译链路

### 2. 构建阶段仍有已知配置警告

- 现象：`pnpm run build` 期间仍提示 `tailwind.config.cjs` 的 ESM 警告
- 处理：保持与前两个 M1 issue 一致，不在本次共享配置任务中扩 scope 处理

## 可沉淀为教程 / 博客的点

- 为什么共享配置也要先做“占位”而不是一次性接满
- 为什么教程前期适合先固定职责，再接入工具链
- 如何用目录与文件级验收保证 monorepo 骨架稳定演进

## 后续待办

- 继续规划 M1 的下一个小任务
- 决定是先写“空应用脚手架策略说明”，还是开始最小共享配置接入

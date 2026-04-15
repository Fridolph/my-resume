# M1 / issue-02 apps 与 packages 占位骨架

- Issue：`#5`
- 里程碑：`M1 基础工程：workspace 骨架初始化`
- 分支：`feat/m1-issue-02-app-package-placeholders`
- 日期：`2026-03-24`

## 背景

`issue-01` 已完成 `workspace` 根骨架初始化，但目标 monorepo 的核心目录还没有真正落到仓库里。  
为了让后续读者理解“最终要演进到什么结构”，需要先把 `apps/*` 和 `packages/*` 以**占位方式**建立出来。

## 本次目标

- 建立 `apps/web`、`apps/admin`、`apps/server`
- 建立 `packages/ui`、`packages/api-client`、`packages/config`
- 为每个目录补最小说明文件
- 扩展目录验收脚本，确保骨架可验证

## 非目标

- 不创建 `Next.js` 应用
- 不创建 `NestJS` 应用
- 不创建共享包真实实现
- 不引入数据库、鉴权、AI、导出等业务能力
- 不迁移旧版 Vue 项目

## TDD / 测试设计

- 先扩展 `scripts/check-workspace.mjs`
- 让脚本开始要求以下路径存在：
  - `apps/web/README.md`
  - `apps/admin/README.md`
  - `apps/server/README.md`
  - `packages/ui/README.md`
  - `packages/api-client/README.md`
  - `packages/config/README.md`
- 先运行一次 `pnpm run test:workspace`
- 确认在目录尚未补齐前失败
- 再根据失败结果补齐最小占位骨架

## 实际改动

- 扩展 `scripts/check-workspace.mjs` 的目录验收范围
- 新增：
  - `apps/web/README.md`
  - `apps/admin/README.md`
  - `apps/server/README.md`
  - `packages/ui/README.md`
  - `packages/api-client/README.md`
  - `packages/config/README.md`
- 更新 `apps/README.md` 与 `packages/README.md`
- 更新 `docs/20-研发流程/02-里程碑与-Issue-拆解建议.md`

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做：

- 目标目录占位
- 最小说明文件
- 与目录占位直接相关的校验与文档更新

没有提前进入：

- 框架脚手架初始化
- 共享配置抽离
- 业务代码实现

### 是否可抽离组件、函数、skills 或其他复用能力

- 当前仍属于工程骨架阶段，没有组件级抽离价值
- `scripts/check-workspace.mjs` 继续作为当前阶段的最小复用验收脚本
- 暂无必要引入新的 skill 或工具抽象

### Review 结论

- 通过
- 可进入自测

## 自测结果

### 1. TDD 首次失败

- `pnpm run test:workspace`
- 结果：失败
- 原因：缺少 `apps/web/README.md`

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

### 1. 新增目录不会出现在 `git diff`

- 现象：新建的占位目录在 `git diff` 中不会直接显示
- 处理：结合 `git status` 与目录扫描一起做 review，确保没有遗漏未跟踪文件

### 2. 构建阶段仍有已知配置警告

- 现象：`pnpm run build` 期间仍提示 `tailwind.config.cjs` 的 ESM 警告
- 处理：保持与 `issue-01` 一致，不在本次目录占位任务中扩 scope 处理

## 可沉淀为教程 / 博客的点

- 为什么目录占位比直接脚手架生成更适合教程前期
- 如何通过 README 先固定应用职责与边界
- 如何继续使用“验收脚本先行”的方式推进工程骨架

## 后续待办

- 继续 M1 的下一个小任务
- 决定是先做共享配置占位，还是进入空应用脚手架策略说明

# GitHub Actions 最小 CI 流程

本文档记录 `M6 / issue-21` 当前阶段的最小 CI 方案，目标是让 `development / main` 上的提交与 PR 都具备统一、可重复的质量门禁。

## 当前目标

- 让 PR 自动执行测试、类型检查、构建
- 让 `development` 作为开发主线时具备基础质量兜底
- 保持流程足够简单，便于教程讲解

## 当前不做什么

- 不做发布流水线
- 不做多环境矩阵
- 不接入部署平台凭据
- 不在本阶段拆分过多并行 job

## 工作流触发时机

- `push` 到：
  - `development`
  - `main`
- `pull_request` 指向：
  - `development`
  - `main`
- 手动触发：`workflow_dispatch`

## 当前执行命令

- `pnpm test:ci`
  - 统一跑 `server / web / admin` 单测与 `server` E2E
- `pnpm typecheck:all`
  - 统一跑 workspace 类型检查
- `pnpm build:all`
  - 统一跑 workspace 构建

## 为什么不再使用旧版“如果脚本存在就运行”

旧版 `ci.yml` 采用“检测根脚本是否存在，再决定是否执行”的方式。  
在当前 monorepo 阶段，这样会带来两个问题：

- 根目录旧的 `build / typecheck` 仍然偏向历史 Vue 单体工程
- 无法清晰表达 `M6` 已经约定好的统一入口

所以在本阶段直接收敛为：

- 显式命令
- 显式分支
- 显式质量门禁

这样更适合教程，也更方便后续扩展。

## 与当前开发流程的关系

当前标准流程是：

- 先本地完成 `plan → TDD → 实现 → review → 自测`
- 再提交分支、发起 PR
- GitHub Actions 负责做远端复验

也就是说，CI 不是替代本地自测，而是作为合并前的第二道门禁。

## 关于“阻止不合格改动进入主线”

要真正做到“阻止”，除了工作流文件本身，还需要在 GitHub 仓库设置中为 `development / main` 配置：

- 必须通过状态检查后才能合并
- 必须通过 PR 合并

本仓库当前先完成工作流文件落地；分支保护规则可在 CI 首次稳定运行后继续补齐并写入部署 / 仓库治理文档。

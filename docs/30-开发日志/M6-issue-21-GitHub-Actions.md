# M6 / issue-21 GitHub Actions

- Issue：`#27`
- 里程碑：`M6 测试、CI/CD、部署：从本地到上线`
- 分支：`feat/m6-issue-21-github-actions`
- 日期：`2026-03-25`

## 背景

`issue-20` 已经把本地测试、类型检查、构建入口收敛完成。  
下一步要解决的是：当分支发起 PR 时，GitHub 端也应该自动执行同一套质量门禁，避免“本地过了、远端没人复验”。

## 本次目标

- 收敛 GitHub Actions 到当前 monorepo 的统一命令入口
- 让 `development / main` 的 push 与 PR 都能自动触发 CI
- 用文档说明当前 CI 的边界与后续扩展方向

## 非目标

- 不做部署流水线
- 不接入多环境矩阵
- 不引入复杂缓存和并行优化

## TDD / 失败现象

### 1. 旧版 `ci.yml` 仍是历史单体工程思路

- 触发分支：`main / dev`
- 执行方式：检测根脚本是否存在，再决定是否执行

### 2. 与当前 monorepo 统一入口不一致

- `issue-20` 已明确：
  - `pnpm test:ci`
  - `pnpm typecheck:all`
  - `pnpm build:all`
- 旧工作流没有直接复用这三条统一门禁命令

## 实际改动

### `.github/workflows/ci.yml`

- 触发分支更新为：
  - `development`
  - `main`
- 新增 `workflow_dispatch`
- 新增 `concurrency`，避免同分支重复执行浪费资源
- 明确 CI 入口：
  - `pnpm test:ci`
  - `pnpm typecheck:all`
  - `pnpm build:all`

### 文档

- 新增 `docs/20-研发流程/05-GitHub-Actions-最小-CI-流程.md`
- 说明：
  - 当前 CI 覆盖范围
  - 为什么不用旧版动态脚本检测
  - CI 与本地自测的关系
  - 分支保护规则需要后续补齐

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做：

- GitHub Actions 最小工作流
- 统一命令入口复用
- 文档落地

没有提前进入：

- Vercel 部署
- 云服务器发布
- 复杂流水线矩阵

### Review 结论

- 通过
- 可进入配置校验与 PR 流程

## 自测与验证

- 本地命令基线复用：
  - `pnpm test:ci`
  - `pnpm typecheck:all`
  - `pnpm build:all`
- 工作流语法校验：
  - `ruby -e "require 'yaml'; YAML.load_file('.github/workflows/ci.yml'); puts 'workflow yaml ok'"`

## 后续待办

- 继续 `issue-22`：部署文档
- 结合首次 CI 运行结果，补分支保护规则说明

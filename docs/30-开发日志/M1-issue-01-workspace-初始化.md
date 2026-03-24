# M1 / issue-01 workspace 初始化

- Issue：`#3`
- 里程碑：`M1 基础工程：workspace 骨架初始化`
- 分支：`feat/m1-issue-01-workspace-bootstrap`
- 日期：`2026-03-24`

## 背景

当前仓库仍以旧版 `Vue3 + Vite` 简历站为主。  
在正式进入 `web/admin/server/packages` 的渐进式重构之前，需要先建立最小 `workspace` 骨架，让后续工程演进有稳定入口。

## 本次目标

- 初始化根级 `pnpm workspace` 配置
- 初始化根级 `turbo` 配置
- 建立 `apps/`、`packages/` 最小骨架
- 保持旧 Vue 项目继续留在根目录

## 非目标

- 不迁移旧 Vue 项目到 `legacy/`
- 不创建 `Next.js`、`NestJS` 应用
- 不进入数据库、鉴权、AI、导出等业务实现
- 不重构旧简历页面和 UI

## TDD / 测试设计

本次任务属于工程基建，不适合先写业务单测，因此采用“验收条件先行”的方式：

- 先补 `scripts/check-workspace.mjs`
- 先定义必须存在的路径：
  - `pnpm-workspace.yaml`
  - `turbo.json`
  - `apps`
  - `packages`
  - `src/App.vue`
  - `vite.config.ts`
- 先运行一次 `pnpm run test:workspace`，确认在骨架未建立前失败
- 再按失败结果补齐最小骨架

## 实际改动

- 根级新增 `pnpm-workspace.yaml`
- 根级新增 `turbo.json`
- 新增 `scripts/check-workspace.mjs`
- 在 `apps/`、`packages/` 下增加最小说明文件
- `package.json` 增加：
  - `private`
  - `packageManager`
  - `typecheck`
  - `test:workspace`
- `.gitignore` 增加 `.turbo`

为恢复旧项目自测，还做了两个最小基线修复：

- 移除未再使用、且当前已无法安装的 `fri-element-plus`
- 将 `typescript` 固定为 `5.4.5`，以兼容当前 `vue-tsc`

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前改动仅聚焦：

- workspace 根配置
- 最小目录骨架
- 最小验收脚本
- 与本次任务直接相关的基线修复

没有提前进入：

- `Next.js`
- `NestJS`
- 共享包实现
- 旧项目迁移

### 是否可抽离组件、函数、skills 或其他复用能力

- 当前没有组件级复用空间
- `scripts/check-workspace.mjs` 已作为本次最小可复用验收脚本沉淀
- 暂无必要额外抽取 skills 或通用函数

### Review 结论

- 通过
- 可进入自测

## 自测结果

### 1. TDD 首次失败

- `pnpm run test:workspace`
- 结果：失败
- 原因：缺少 `pnpm-workspace.yaml`

### 2. 骨架验收

- `pnpm run test:workspace`
- 结果：通过

### 3. 类型检查

- `pnpm run typecheck`
- 结果：通过

### 4. 构建验证

- `pnpm run build`
- 结果：通过

### 5. 手工检查

- 旧 Vue 项目仍保留在根目录
- `apps/`、`packages/` 已存在
- 还没有提前创建 `web/admin/server` 业务应用实现

## 遇到的问题

### 1. `pnpm install` 被旧依赖阻塞

- 原因：`fri-element-plus` 当前已不可正常解析
- 处理：确认项目中已不再使用后移除

### 2. `vue-tsc` 与 `typescript` 不兼容

- 原因：安装后解析到 `typescript@5.9.x`
- 处理：将 `typescript` 固定到 `5.4.5`

### 3. 构建时出现 `tailwind.config.cjs` 的 ESM 警告

- 现状：构建最终仍成功
- 处理：本次不扩 scope，后续如需要可单开 issue 处理配置兼容

### 4. 长期开发分支命名与远端冲突

- 现状：远端已存在 `ai-refactor/dev`
- 问题：Git 引用路径冲突，导致无法再创建顶层 `dev`
- 决策：后续长期开发分支统一改为 `development`
- 处理：同步更新 `AGENTS.md` 与研发流程文档中的分支约定

## 可沉淀为教程 / 博客的点

- 为什么 Monorepo 重构第一步不能直接迁移业务
- 如何用“验收脚本先行”替代纯业务型 TDD
- 如何在不扩 scope 的前提下修复阻塞自测的旧依赖问题

## 后续待办

- 继续规划 `M1` 的下一个正式编码 Issue
- 决定下一步是“空应用占位”还是直接进入 `M2`

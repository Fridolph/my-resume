# M8 / issue-40 开发日志：admin / web 共享契约切换与冒烟验证

- Issue：#68
- 里程碑：M8 数据持久化与共享契约：从内存态到可持续演进
- 分支：`fys-dev/feat-m8-issue-40-shared-contract-smoke`
- 日期：2026-03-26

## 背景

在 `issue-38` 和 `issue-39` 完成后，简历草稿 / 发布流已经具备：

- 数据库存储
- 共享契约
- admin / web 的最小接入

但这些能力是否真的能在本地跑通，仍然需要一次收束性的真实验证。

`issue-40` 的目标不是再加新功能，而是把 M8 已经搭好的基础设施真正串起来，确认它已经从“能跑测试”进入“能解释、能演示、能继续迭代”的状态。

## 本次目标

- 确认 `apps/admin` 与 `apps/web` 已切到共享契约
- 完成一次真实的本地冒烟验证
- 收敛 M8 阶段范围，补足阶段性总结材料

## 非目标

- 不做新的 UI 改版
- 不扩展新的业务功能
- 不推进部署优化

## TDD / 验证设计

本次验证重点不在新增复杂测试，而在“用最小补丁修掉联调暴露的问题，并让真实链路跑通”。

### 1. 基础保护测试

新增：

- `apps/server/src/config/repo-root.spec.ts`

并补充：

- `apps/server/src/config/env-paths.spec.ts`

覆盖点：

- 源码目录下的 repo root 解析正确
- `dist` 目录运行时的 repo root 解析也正确

### 2. 回归验证

执行：

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/config/repo-root.spec.ts src/config/env-paths.spec.ts src/database/database.config.spec.ts`
- `pnpm typecheck:all`
- `pnpm test:ci`
- `pnpm build:all`

### 3. 本地人工冒烟

实际跑起：

- `apps/server`
- `apps/admin`
- `apps/web`

验证链路：

- 后台页面成功读取草稿
- 使用真实本地 API 完成保存草稿与发布
- `web` 页面的 SSR 输出中已能读取最新已发布标题与摘要

## 实际改动

### 1. 修复 server 运行时仓库根路径解析

新增：

- `apps/server/src/config/repo-root.ts`
- `apps/server/src/config/repo-root.spec.ts`

更新：

- `apps/server/src/config/env-paths.ts`
- `apps/server/src/database/database.config.ts`
- `apps/server/src/config/env-paths.spec.ts`

本次联调暴露出的真实问题是：

- `drizzle-kit push` 使用的是仓库根目录的 `.data/my-resume.db`
- 但 server 运行时错误地把 repo root 解析成了 `apps/`
- 导致实际连接到了 `apps/.data/my-resume.db`

最终表现为：

- 测试能过
- 推表看起来没问题
- 本地联调时却报 `resume_drafts` 不存在

这类问题非常典型，也非常适合作为教程里的“真实收束问题”案例。

### 2. 用向上查找 workspace 标记文件的方式收束根目录判断

新的策略不是继续写死相对层级，而是：

- 从当前目录向上查找 `pnpm-workspace.yaml` 或 `.git`
- 找到后认定为仓库根目录
- 如果极端情况下找不到，再退回旧的相对路径 fallback

这样能同时兼容：

- `src/**` 下运行
- `dist/src/**` 下运行

### 3. 完成真实本地冒烟

本次实际验证了两类结果：

#### admin 侧

- 打开 `http://127.0.0.1:5566/dashboard`
- 后台页面能真实读到草稿字段
- 草稿编辑面板不再出现 500

#### publish / web 侧

使用真实本地接口完成：

- 登录
- 保存草稿
- 发布
- 读取公开简历

并确认：

- `http://127.0.0.1:5555` 的 SSR 输出中出现：
  - `M8 冒烟验证标题`
  - `M8 阶段冒烟验证：后台保存、发布与公开读取链路已打通。`

这说明 M8 的主链路已经从后台保存一路连到了公开站读取。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次重点是“收束与验证”，没有越界去做：

- 新 UI 改版
- 新业务模块
- 更复杂的内容管理功能

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

本次新增的最关键公共能力是：

- `resolveRepoRoot(...)`

它不仅修复了当前联调问题，也为后续：

- 环境文件定位
- 本地数据库定位
- 其他 CLI / runtime 场景

提供了更稳定的根目录判断方式。

### 本次最关键的边界判断

我们没有为了“做冒烟验证”去补一套新的复杂 E2E 框架，而是：

- 用现有测试保护基础行为
- 用真实本地服务启动验证链路
- 只修复联调过程中真实暴露的根因问题

这更符合当前教程型项目的节奏。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/config/repo-root.spec.ts src/config/env-paths.spec.ts src/database/database.config.spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm typecheck:all`
- `pnpm test:ci`
- `pnpm build:all`

结果：全部通过。

## 人工冒烟记录

### 本地启动

- `pnpm --filter @my-resume/server db:push`
- `pnpm --filter @my-resume/server start:dev`
- `pnpm --filter @my-resume/admin dev`
- `pnpm --filter @my-resume/web dev`

### 冒烟结果

- `admin` 仪表盘成功加载草稿编辑面板
- 本地 API 保存草稿成功
- 本地 API 发布成功
- `web` 页面读取到最新已发布标题和摘要

## 遇到的问题

### 1. `db:push` 看起来成功，但运行时仍然报表不存在

问题：

这是本次最有价值的真实问题。症状看起来像是“数据库没推表”，但实际根因是：

- 推表库和运行时连接库不是同一个文件

处理：

- 把 repo root 判断改成向上查找 workspace 标记文件

### 2. 冒烟阶段比单测更容易暴露路径类问题

问题：

单测和 e2e 都通过，不代表真实 dev server 场景就一定没问题。

处理：

- 保留“每个阶段做一次真实本地冒烟”的流程
- 把这类问题记录进里程碑日志和教程材料

## 可沉淀为教程/博客的点

- 为什么 monorepo 里“路径解析”是比业务代码更容易踩坑的地方
- 为什么测试都通过后，仍然要做一次真实本地冒烟
- M8 如何从“内存态 demo”走到“可持续演进的基础设施”

## 后续待办

- 合并 `issue-40`
- 关闭 M8 里程碑
- 继续规划下一个阶段的内容演进

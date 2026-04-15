# M2 / issue-05 apps-server 最小 NestJS 脚手架

- Issue：`#14`
- 里程碑：`M2 鉴权与角色：最小登录闭环`
- 分支：`feat/m2-issue-05-server-bootstrap`
- 日期：`2026-03-24`

## 背景

`M1` 已完成 monorepo 骨架与占位，但仓库还没有真实业务后端。  
进入 `M2` 后，所有鉴权与角色能力都必须先有统一承载入口，因此第一步先创建 `apps/server` 的最小 `NestJS` 脚手架。

## 本次目标

- 创建最小 `NestJS` 应用到 `apps/server`
- 让 `apps/server` 成为后续鉴权与角色的唯一业务后端入口
- 保持根级旧 Vue 项目继续可用
- 补充本次任务开发日志

## 非目标

- 不接数据库
- 不接 Redis
- 不实现登录
- 不实现角色权限
- 不创建 `apps/admin` / `apps/web` 真实应用

## TDD / 测试设计

- 先扩展 `scripts/check-workspace.mjs`
- 让脚本开始要求以下路径存在：
  - `apps/server/package.json`
  - `apps/server/nest-cli.json`
  - `apps/server/tsconfig.json`
  - `apps/server/src/main.ts`
  - `apps/server/test/app.e2e-spec.ts`
- 先运行一次 `pnpm run test:workspace`
- 确认在真实脚手架尚未生成前失败
- 再生成最小 `NestJS` 脚手架并补项目化说明

## 实际改动

- 扩展 `scripts/check-workspace.mjs` 的 `apps/server` 验收范围
- 创建最小 `NestJS` 脚手架到 `apps/server`
- 将默认模板最小对齐到当前仓库：
  - 调整包名为 `@my-resume/server`
  - 将默认端口改为 `3001`
  - 将默认 README 改写为本项目说明
- 更新 `docs/20-研发流程/02-里程碑与-Issue-拆解建议.md`

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做：

- `apps/server` 最小脚手架
- 与脚手架直接相关的最小项目化对齐
- 本次任务开发日志与 M2 拆解细化

没有提前进入：

- 鉴权实现
- 角色模型实现
- 数据库与 Redis 接入
- 后台前端创建

### 是否可抽离组件、函数、skills 或其他复用能力

- 当前仍处于脚手架阶段，没有组件级抽离空间
- `scripts/check-workspace.mjs` 继续作为阶段性验收脚本
- 暂无必要抽离额外 skill 或公共函数

### Review 结论

- 通过
- 可进入自测

## 自测结果

### 1. TDD 首次失败

- `pnpm run test:workspace`
- 结果：失败
- 原因：缺少 `apps/server/package.json`

### 2. 骨架验收

- `pnpm run test:workspace`
- 结果：通过

### 3. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

### 4. `apps/server` 测试

- `pnpm --filter @my-resume/server exec jest --runInBand`
- 结果：通过
- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand`
- 结果：通过

### 5. 根级验证

- `pnpm run typecheck`
- 结果：通过
- `pnpm run build`
- 结果：通过
- 备注：仍存在 `tailwind.config.cjs` 的 ESM 警告，但与本次任务无关，且构建成功

## 遇到的问题

### 1. Nest CLI 的 `--directory` 路径表现与预期不一致

- 现象：传入绝对路径时，CLI 最终把生成结果落到了仓库内的 `tmp/` 相对目录
- 处理：确认实际生成目录后，再将脚手架内容同步到 `apps/server`

### 2. `apps/server` 中残留了旧的忽略产物目录

- 现象：目录内存在历史留下的 `dist`、`node_modules` 与空目录
- 处理：用一次干净重建替换 `apps/server`，确保脚手架结果纯净

### 3. `pnpm --filter ... test -- --runInBand` 不适合当前 Jest 脚本

- 现象：额外参数被当作 Jest pattern，导致 “No tests found”
- 处理：改用 `pnpm --filter @my-resume/server exec jest --runInBand` 与 `exec jest --config ...`

### 4. 安装阶段出现现有 ESLint peer warning

- 现象：根仓库现有 Vue ESLint 依赖与新引入的 ESLint 9 生态存在 peer warning
- 处理：本次先不扩 scope 处理，后续在共享配置或 admin/web 真应用阶段统一整理

## 可沉淀为教程 / 博客的点

- 为什么 M2 的第一步必须先创建唯一业务后端
- 如何在 monorepo 中渐进引入第一个真实应用
- 如何把官方脚手架最小化对齐到项目上下文

## 后续待办

- 继续 `issue-06`：鉴权领域与角色模型

# P1：正式版 API Server 与 Drizzle 基座搭建记录

## 背景

在完成过渡版 P1 之后，第二阶段已经确认了一件事：项目确实需要真实数据层，但它也已经不适合继续把业务后端能力散落在 Nuxt 内部 server routes 中。

因此，正式版 P1 的目标不再是继续扩大过渡实现，而是把第二阶段真正需要的后端基础设施搭起来。换句话说，这一轮工作的重点，不是某一个业务模块，而是让整个仓库具备长期可扩展的三端基础结构。

## 本次目标

正式版 P1 主要完成四件事。

- 新建 `apps/api-server`，作为统一后端入口
- 将 `packages/database` 重构为 Drizzle ORM 方案
- 建立数据库迁移和健康检查能力
- 在不破坏现有 Admin / Web 的前提下，完成正式技术栈切换

这一步完成后，第二阶段后续的模块迁移才有稳定的落点。

## 本次实现

### 1. 新建 `apps/api-server`

本次新增了 `apps/api-server`，并使用 NestJS 建立了最小可运行骨架。

当前已经完成的基础结构包括：

- `AppModule`
- `DatabaseModule`
- `HealthModule`
- `main.ts` 启动入口

这意味着 Monorepo 已经从“双前端项目”正式进入“Web + Admin + API”三端协同阶段。

### 2. 重构 `packages/database`

本次将 `packages/database` 从过渡期的手写数据访问层，重构为正式版 Drizzle 数据库包。

当前数据库包已经具备以下内容：

- 统一数据库路径解析
- SQLite 连接初始化
- Drizzle schema 组织方式
- migration 目录与迁移脚本
- 站点设置仓储函数兼容层

虽然当前 SQLite 运行时驱动仍然使用 `node:sqlite`，但 ORM 标准层已经统一为 Drizzle。对于这个阶段来说，这一点比“是否立刻切到某个原生 SQLite 驱动”更重要，因为它让后续所有数据库结构和仓储设计都回到了同一套规范下。

### 3. 建立迁移机制

正式版 P1 不再只是“程序启动时顺便建表”，而是补上了数据库迁移能力。

当前已经具备：

- `drizzle.config.ts`
- `drizzle/` 迁移目录
- `db:migrate` 命令
- `__drizzle_migrations` 迁移记录表

这一步的意义在于，第二阶段后续所有表结构变化都可以有明确的迁移轨迹，而不再依赖临时脚本或运行时隐式建表。

### 4. 建立健康检查接口

本次在 `apps/api-server` 中增加了 `GET /api/health`。

这个接口当前会返回：

- API 服务状态
- 当前时间戳
- 数据库类型与 ORM 信息
- SQLite 文件路径与是否存在

这虽然是一个很小的接口，但它是后续服务治理、部署检查和环境联调的基础入口。

### 5. 保持旧链路兼容

正式版 P1 不是直接把旧逻辑全部删掉，而是先完成底层对齐，再保留现有 Admin / Web 对共享数据库包的兼容。

这样做有两个好处：

- 当前仓库不会在正式 P1 阶段突然失去可运行状态
- 下一阶段可以专注迁移 `site settings` 到新 API Server，而不是同时处理太多破坏性改动

这也是这次 P1 比较重要的一个实现原则：先把基础设施切正，再逐步迁移业务入口。

## 关键技术判断

### 为什么这一轮仍然保留 `node:sqlite`

从技术栈目标来看，我们坚持的是 `SQLite + Drizzle ORM`。这次实现里，ORM 已经统一为 Drizzle，但 SQLite 的运行时驱动仍然使用 `node:sqlite`。

原因不是方向变化，而是现实工程取舍。当前环境里的 `better-sqlite3` 原生绑定仍然不稳定，如果正式版 P1 继续被这个问题卡住，第二阶段后续所有业务迁移都会被拖慢。

因此，这一轮优先保证了两件更重要的事情：

- ORM 层统一回到 Drizzle
- API Server 和数据库迁移机制先建立起来

这意味着数据库技术路线已经回到正确轨道，后续如果要调整底层 SQLite 驱动，代价也会比在过渡方案时期小很多。

### 为什么先做健康检查而不是直接上业务模块

正式版 P1 的本质是“基座搭建”，不是“业务迁移”。

先把健康检查、数据库模块、迁移脚本和 API 项目结构搭好，后续每个模块都能直接复用这套底座。这样进入 P2 时，我们处理的是站点设置模块的正式迁移，而不是一边迁模块，一边补基础设施。

## 本地自测结果

本次已完成以下验证。

### 1. 类型检查通过

执行通过：

- `pnpm --dir packages/database typecheck`
- `pnpm --dir apps/api-server typecheck`
- `pnpm --dir apps/admin typecheck`
- `pnpm --dir apps/web typecheck`

### 2. 数据库迁移通过

执行通过：

- `pnpm --dir packages/database db:migrate`

并已确认数据库中存在以下表：

- `site_settings`
- `__drizzle_migrations`

### 3. API Server 健康检查通过

已验证：

- API Server 可以本地启动
- `GET /api/health` 可以返回 `status: ok`
- 返回体中包含数据库路径、ORM 类型和 SQLite 文件存在状态

## 当前结果

正式版 P1 完成后，第二阶段已经真正拥有了以下基础：

- 独立的 NestJS API Server
- 统一的 Drizzle ORM 数据层
- 可执行的数据库迁移机制
- 健康检查接口
- 向 P2 迁移业务模块的稳定起点

这意味着第二阶段从这一刻开始，不再只是“准备做后端”，而是已经具备了正式后端基础设施。

## 下一步

正式版 P1 完成后，最自然的下一步就是进入 `P2`：站点设置模块正式迁移闭环。

下一阶段需要完成的重点包括：

- 在 `apps/api-server` 中建立 `SiteSettingsModule`
- 提供站点设置查询与更新接口
- 让 `packages/sdk` 开始封装真实 API 请求
- 让 `apps/admin` 与 `apps/web` 从旧链路切换到统一 API Server

当这条链路完成后，第二阶段的三端统一架构才算真正进入业务兑现阶段。

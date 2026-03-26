# M8 / issue-36 开发日志：Drizzle / libsql 最小接入与环境边界

- Issue：#64
- 里程碑：M8 数据持久化与共享契约：从内存态到可持续演进
- 分支：`fys-dev/feat-m8-issue-36-db-bootstrap`
- 日期：2026-03-26

## 背景

进入 M8 之前，`apps/server` 的简历草稿与发布流仍以内存态为主。这样虽然足够支撑前几个教学里程碑，但一旦服务重启，数据就会丢失，也无法继续承接后续的表结构设计与服务持久化改造。

因此这一小步的目标不是“把数据库一步做完”，而是先把数据库骨架、环境变量边界和 CLI 入口立住，让后续 issue 能在统一基础上继续推进。

## 本次目标

- 在 `apps/server` 接入 `Drizzle ORM + @libsql/client`
- 明确本地默认数据库地址与环境变量边界
- 建立 `NestJS` 内可复用的数据库 provider
- 提供最小命令入口：连接探测、schema 推送

## 非目标

- 不在本次设计简历业务表
- 不改造 `ResumePublicationService`
- 不引入 Redis、队列或 AI 持久化
- 不做前端联调与 UI 调整

## TDD / 测试设计

本次先围绕“环境解析”和“最小连接可用性”补测试：

### 1. 数据库配置测试

新增：

- `apps/server/src/database/database.config.spec.ts`

覆盖：

- 未配置 `DATABASE_URL` 时，回退到仓库级本地 sqlite 文件
- 显式配置 `DATABASE_URL` 与 `DATABASE_AUTH_TOKEN` 时优先使用显式值
- 兼容 `TURSO_AUTH_TOKEN` 这类 libsql/turso 风格变量

### 2. 数据库连接探测测试

新增：

- `apps/server/src/database/database.client.spec.ts`

覆盖：

- 可以连接到本地临时 sqlite 文件
- 可以执行最小探针查询 `select 1`

这样设计的原因是：当前 issue 只负责“数据库骨架能跑”，还不该提前进入业务表与仓储层测试。

## 实际改动

### 1. 补齐 server 侧数据库基础设施目录

新增：

- `apps/server/src/database/database.config.ts`
- `apps/server/src/database/database.client.ts`
- `apps/server/src/database/database.module.ts`
- `apps/server/src/database/database.tokens.ts`
- `apps/server/src/database/check-database.ts`
- `apps/server/src/database/schema.ts`

其中：

- `database.config.ts` 负责环境变量解析与默认本地数据库路径
- `database.client.ts` 负责 `libsql client` 与 `drizzle` 实例创建
- `database.module.ts` 负责把数据库能力注入到 `NestJS`

### 2. 在 `AppModule` 中注册全局数据库模块

更新：

- `apps/server/src/app.module.ts`

这样后续 issue 在改造服务层时，可以直接通过统一 token 接入数据库，而不必重新散落式创建客户端。

### 3. 建立 drizzle CLI 配置与脚本入口

新增 / 更新：

- `apps/server/drizzle.config.ts`
- `apps/server/package.json`

新增脚本：

- `db:check`
- `db:generate`
- `db:push`
- `db:studio`

当前阶段最重要的不是把命令做多，而是把命令入口统一下来，保证教学节奏里每一步都可解释。

### 4. 明确本地数据库默认位置与忽略规则

更新：

- `.env.example`
- `.gitignore`

默认开发库位置为仓库根目录下：

- `file:./.data/my-resume.db`

这样本地调试简单直接，也能为未来切换远端 `libsql` 保留同一套协议边界。

### 5. 补充当前阶段说明文档

更新：

- `apps/server/README.md`
- `docs/20-研发流程/02-里程碑与-Issue-拆解建议.md`

前者让 server 当前阶段与运行方式更清晰，后者正式把 M8 的拆解建议补进规划文档。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只补了：

- 数据库运行时配置
- `NestJS` provider
- drizzle CLI 配置
- 最小连接探测与推表入口

没有越界去做：

- 简历草稿 / 发布快照表
- 服务持久化重构
- 共享 API 契约抽离

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

有一处关键抽离已经完成：

- `ensureLocalDatabaseDirectory`

它被运行时数据库 client 和 `drizzle.config.ts` 共同复用，避免“应用里能自动建目录、CLI 却打不开数据库”这种双入口分裂问题。

### 这次最重要的边界判断

为了让 `drizzle-kit push` 在教学流程和 CI 环境中都可运行，本次只引入了一个极小的基础表 `system_meta`，它不承载简历业务，只用于验证 schema 推送链路已经打通。

真正的业务表设计放在下一步 `issue-37`，这样节奏更清楚，也更符合教程型项目“小步落地”的目标。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server exec jest --runInBand src/database/database.config.spec.ts src/database/database.client.spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`
- `pnpm --filter @my-resume/server db:check`
- `pnpm --filter @my-resume/server db:push`

结果：全部通过。

补充说明：

- `db:push` 初次验证时遇到了 drizzle CLI 的非 TTY 交互确认问题
- 最终通过 `--force` 与共享目录准备逻辑，保证 CLI / 本地 shell / 后续 CI 都能稳定运行

## 遇到的问题

### 1. 本地 sqlite 文件目录不会被 drizzle CLI 自动创建

问题：

`db:check` 能通过，是因为运行时代码里会先确保目录存在；但 `drizzle-kit push` 自己执行时，如果 `.data/` 目录还没创建，会直接连接失败。

处理：

- 把本地目录准备逻辑抽到 `database.config.ts`
- 让 `database.client.ts` 与 `drizzle.config.ts` 共用

### 2. drizzle CLI 在非交互环境会要求 TTY 确认

问题：

CLI 默认会等待交互确认，这不适合当前终端环境，也不适合未来 CI。

处理：

- 将 `db:push` 改成 `drizzle-kit push --force`
- 保持当前 schema 足够小，避免误导为“生产环境直接强推全部业务表”

## 可沉淀为教程/博客的点

- 为什么教程型重构要先做“数据库骨架”，而不是直接改业务服务
- `SQLite/libsql` 在本地开发和未来云端演进之间如何保持一套协议边界
- 为什么要避免“运行时一套初始化、CLI 一套初始化”的双入口分裂

## 后续待办

- 继续推进 `M8 / issue-37`：简历草稿 / 发布快照表设计
- 在 `issue-37` 中把当前临时基础表与真正业务 schema 的边界讲清楚
- 为 `issue-38` 的服务持久化改造准备更稳定的 repository 入口

# apps/server

本目录是个人简历 monorepo 的唯一业务后端入口。

## 当前阶段

- 当前里程碑：`M8 / issue-36`
- 当前目标：补齐 `Drizzle + SQLite/libsql` 最小数据库骨架
- 当前状态：在既有 `NestJS` 业务后端上逐步引入持久化基础设施

## 后续职责

- 承接鉴权与角色模型
- 提供数据库、队列、导出等基础设施能力
- 提供登录、权限守卫与后续业务 API
- 作为 `apps/admin` 与 `apps/web` 的统一业务后端

## 当前边界

- 当前只接数据库最小骨架，不改造业务表
- 当前不接 Redis
- 不在本任务里改造 AI、文件、导出业务逻辑
- 简历草稿 / 发布态的真正表结构放到后续 issue 落地

## 本地运行

```bash
pnpm install
pnpm --filter @my-resume/server start:dev
```

数据库基础检查：

```bash
pnpm --filter @my-resume/server db:check
```

## 模块脚手架（推荐）

新增 `apps/server/src/modules/*` 目录模块时，先用 Nest CLI 骨架生成：

```bash
pnpm --filter @my-resume/server scaffold:module -- <module-name>
```

例如：

```bash
pnpm --filter @my-resume/server scaffold:module -- user
```

该命令会先执行 `nest g module/controller/service`，再补齐模块分层目录与 `README.md`，便于后续按 `domain / application/services / infrastructure/repositories / transport/controllers + dto` 演进。

本地 SQLite 提醒：

- 默认数据库文件位于仓库根目录 `.data/my-resume.db`
- 如果服务运行期间用 DB Browser 等工具长时间占用该文件，草稿保存或发布可能触发 `SQLITE_BUSY: database is locked`
- 当前服务端已补充更明确的错误提示，但本地排查时仍建议先关闭外部数据库 GUI 工具再重试

默认端口：

- `5577`

## Swagger API 文档

服务启动后可访问：

- Swagger UI：`http://localhost:5577/api/docs`
- OpenAPI JSON：`http://localhost:5577/api/docs-json`

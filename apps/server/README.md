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

默认端口：

- `5577`

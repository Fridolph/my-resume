# apps/server

本目录是个人简历 monorepo 的唯一业务后端入口。

## 当前阶段

- 当前里程碑：`M2 / issue-05`
- 当前目标：创建最小 `NestJS` 脚手架
- 当前状态：仅保留默认 `AppModule` / `AppController` / `AppService`

## 后续职责

- 承接鉴权与角色模型
- 提供登录、权限守卫与后续业务 API
- 作为 `apps/admin` 与 `apps/web` 的统一业务后端

## 当前边界

- 不接数据库
- 不接 Redis
- 不实现登录
- 不实现角色权限
- 不接 AI、文件、导出等模块

## 本地运行

```bash
pnpm install
pnpm --filter @my-resume/server start:dev
```

默认端口：

- `3001`

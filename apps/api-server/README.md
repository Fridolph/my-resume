# API Server

`apps/api-server` 是当前 monorepo 中的 NestJS API 服务，负责统一的后台管理接口与公开内容接口。

## 主要职责

- 提供 `/api/admin/*` 后台管理接口
- 提供 `/api/public/*` 公开内容接口
- 提供登录、权限守卫、发布流、版本能力
- 连接 `SQLite + Drizzle ORM`

## 本地默认地址

- `http://127.0.0.1:3011`

## 关键环境变量

- `PORT=3011`
- `REPO_DATABASE_PATH=./data/platform.sqlite`

## 启动命令

从仓库根目录执行：

```bash
pnpm dev:api
```

或在当前目录执行：

```bash
pnpm dev
```

## 常用数据库命令

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:studio
pnpm db:status
```

## 核心接口前缀

- 后台：`/api/admin`
- 公开：`/api/public`
- 健康检查：`/api/health`

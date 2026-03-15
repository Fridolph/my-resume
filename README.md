# My Resume Platform

一个基于 monorepo 的个人内容平台，当前包含三端统一架构：

- `apps/web`：Nuxt 4 展示端
- `apps/admin`：Nuxt 4 管理后台前端
- `apps/api-server`：NestJS API Server
- `packages/database`：`SQLite + Drizzle ORM`

当前第二阶段已经完成核心内容链路、权限边界、版本与发布流，并正在收口测试、环境与部署文档。

## 技术栈

- 前端：`Nuxt 4`、`TypeScript`、`@nuxt/ui`
- 后端：`NestJS`
- 数据库：`SQLite`
- ORM：`Drizzle ORM`
- 包管理：`pnpm workspace`

## 仓库结构

```text
apps/
  web/         展示端
  admin/       管理后台前端
  api-server/  NestJS API 服务
packages/
  database/    数据库 schema、client、migration
  sdk/         前后端共享 API Client
  types/       共享类型定义
  ui/          共享 UI 组件/样式资产
  content-schema/
```

## 本地默认端口

- `web`：`http://localhost:3000`
- `admin`：默认 `http://localhost:3002`，若端口被占用会自动切换到其它可用端口
- `api-server`：`http://127.0.0.1:3011`

## 环境变量

复制示例文件：

```bash
cp .env.example .env
```

当前本地开发主要使用以下变量：

- `PORT`：`api-server` 监听端口，默认 `3011`
- `CORS_ORIGIN`：线上允许访问 API 的来源列表，多个域名用逗号分隔
- `REPO_DATABASE_PATH`：SQLite 数据库文件路径，默认 `./data/platform.sqlite`
- `NUXT_PUBLIC_PUBLIC_API_BASE_URL`：`web` 端公开 API 基地址
- `NUXT_PUBLIC_ADMIN_API_BASE_URL`：`admin` 端后台 API 基地址
- `NUXT_PUBLIC_SITE_URL`：`web` 端线上站点域名

> 兼容说明：`apps/web` 与 `apps/admin` 仍兼容旧变量 `NUXT_PUBLIC_API_BASE_URL`，但后续建议分别使用新的变量名。

## 安装依赖

```bash
pnpm install
```

## 数据库初始化

首次启动前建议先执行：

```bash
pnpm db:migrate
```

常用数据库命令：

```bash
pnpm db:generate
pnpm db:migrate
pnpm --dir apps/api-server db:studio
pnpm --dir apps/api-server db:status
```

## 启动三端

推荐开三个终端分别执行：

```bash
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

## 常用命令

```bash
pnpm typecheck
pnpm lint
pnpm --dir apps/api-server test:run
```

## 推荐启动顺序

1. `pnpm install`
2. `cp .env.example .env`
3. `pnpm db:migrate`
4. `pnpm dev:api`
5. `pnpm dev:web`
6. `pnpm dev:admin`

## 联调检查

- 打开 `http://localhost:3000` 检查展示端
- 打开终端输出中的 Admin 地址检查后台登录页（默认是 `http://localhost:3002`，端口被占用时会自动切换）
- 打开 `http://127.0.0.1:3011/api/public/release` 检查公开发布接口

## 常见排查

### 1. 端口被占用

优先检查：

- `3000`
- `3002`（admin 默认端口，已支持自动切换）
- `3011`

可以使用：

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:3002 -sTCP:LISTEN
lsof -nP -iTCP:3011 -sTCP:LISTEN
```

### 2. 后台或前台请求地址不对

检查 `.env` 中：

- `NUXT_PUBLIC_PUBLIC_API_BASE_URL`
- `NUXT_PUBLIC_ADMIN_API_BASE_URL`

### 3. 数据库无法访问或迁移失败

检查：

- `REPO_DATABASE_PATH` 路径是否正确
- `data/` 目录是否存在
- migration 是否已执行

### 4. Drizzle Studio 无法启动

优先确认：

- `apps/api-server/drizzle.config.ts` 存在
- 在 `apps/api-server` 目录执行 `pnpm db:studio`

## 文档索引

- 第二阶段架构方案：`docs/phase-2/2026-03-07-第二阶段三端统一架构方案.md`
- 第二阶段里程碑：`docs/phase-2/里程碑规划.md`
- 当前阶段博客记录：`docs/phase-2/`


## 部署参考

- 第二阶段部署设计：`docs/phase-2/2026-03-08-P7-4-部署方案与上线前检查项设计.md`
- 上线前检查清单：`docs/phase-2/上线前检查清单.md`

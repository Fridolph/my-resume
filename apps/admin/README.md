# Admin App

`apps/admin` 是当前 monorepo 中的 Nuxt 4 管理后台前端，负责内容管理与运营入口。

## 主要职责

- 登录与后台会话建立
- 用户、文案、简历、项目、站点设置管理
- 统一发布批次管理
- 消费 `api-server` 的 `/api/admin/*` 接口

## 本地默认地址

- `http://localhost:3002`

## 关键环境变量

优先使用：

- `NUXT_PUBLIC_ADMIN_API_BASE_URL=http://localhost:3011/api/admin`

兼容旧变量：

- `NUXT_PUBLIC_API_BASE_URL`

## 启动命令

从仓库根目录执行：

```bash
pnpm dev:admin
```

或在当前目录执行：

```bash
pnpm dev
```

## 联调前提

请先确保：

- `apps/api-server` 已启动
- 数据库 migration 已执行
- 本地存在可用演示账号

## 常用验证页面

- `/login`
- `/`
- `/users`
- `/translations`
- `/resume`
- `/projects`
- `/settings`
- `/releases`

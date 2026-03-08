# Web App

`apps/web` 是当前 monorepo 中的 Nuxt 4 展示端，负责公开站点页面展示。

## 主要职责

- 首页、简历页、项目列表页、项目详情页
- 公开多语言文案读取
- 公开 SEO 能力与内容站能力
- 消费 `api-server` 的 `/api/public/*` 接口

## 本地默认地址

- `http://localhost:3000`

## 关键环境变量

优先使用：

- `NUXT_PUBLIC_PUBLIC_API_BASE_URL=http://localhost:3011/api/public`

兼容旧变量：

- `NUXT_PUBLIC_API_BASE_URL`

## 启动命令

从仓库根目录执行：

```bash
pnpm dev:web
```

或在当前目录执行：

```bash
pnpm dev
```

## 验证页面

- `/`
- `/resume`
- `/projects`
- `/projects/[slug]`

## 依赖说明

`apps/web` 依赖：

- `apps/api-server` 已启动
- 公开 API 地址配置正确
- 数据库中已有可公开内容与激活发布批次

# my-resume

一个以“个人简历重构”为主题的教程型全栈 monorepo。

当前仓库已经从旧版静态 `Vue3 + Vite` 简历站，渐进重构到新的三端结构：

- `apps/web`：公开简历展示端
- `apps/admin`：后台管理端
- `apps/server`：唯一业务后端

项目定位是“可学习、可开源、可部署、可继续演进”的基础教程版，而不是一次性做成复杂 SaaS。

## 当前状态

当前仓库已经达到开源版最小闭环：

- 三端可独立启动与访问
- 公开站可读取已发布双语简历
- 后台具备草稿编辑、发布、导出与角色边界
- AI 工作台已具备分析、结构化建议、模块级 diff / apply 与 apply 后草稿反馈

如果你是第一次进入仓库，建议把它理解成：

- 一个已经能跑通主线的教程型作品
- 一个适合继续做页面升级与个人产品分支扩展的基础底座
- 一个明确收住边界的开源版，而不是复杂产品的完整版

## 当前能力

- `web / admin / server` 三端可独立启动
- `admin / viewer` 最小鉴权与角色边界
- 双语标准简历内容模型与草稿 / 发布流
- `Markdown / PDF` 导出与下载
- SQLite / libsql + Drizzle 持久化
- `light / dark` 主题基线
- AI 文件提取、简历分析、结构化优化建议与一键应用草稿
- GitHub Actions、Vercel / 云服务器部署基础说明
- Docker Compose 一键本地启动

## 仓库结构

```text
apps/
  admin/   Next.js 后台管理端
  web/     Next.js 公开展示端
  server/  NestJS 业务后端

packages/
  api-client/  最小共享契约
  config/      共享配置
  ui/          最小共享 UI 与主题

docs/
  00-文档导航.md
  10-架构设计/
  20-研发流程/
  30-开发日志/
  40-教程与博客/
```

## 快速开始

### 方式一：本地开发

1. 安装依赖

```bash
pnpm install
```

2. 准备环境变量

```bash
cp .env.example .env
```

最少需要确认这些变量：

- `JWT_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `RESUME_API_BASE_URL`
- `AI_PROVIDER`
- 对应 AI Provider 的 API Key

3. 启动三端

```bash
pnpm dev
```

也可以分别启动：

```bash
pnpm dev:server
pnpm dev:web
pnpm dev:admin
```

默认端口：

- `web`：`http://localhost:5555`
- `admin`：`http://localhost:5566`
- `server`：`http://localhost:5577`

### 默认演示账号

当前本地默认演示账号为：

- `admin / admin123456`
- `viewer / viewer123456`

这些账号只适合本地教程演示；如果你要对外部署，请自行替换。

### 方式二：Docker Compose

1. 准备环境变量

```bash
cp .env.example .env
```

2. 一键启动

```bash
pnpm docker:up
```

或直接：

```bash
docker compose up --build
```

首次构建完成后，同样访问：

- `web`：`http://localhost:5555`
- `admin`：`http://localhost:5566`
- `server`：`http://localhost:5577`

停止容器：

```bash
pnpm docker:down
```

## 常用命令

```bash
pnpm test
pnpm test:e2e
pnpm typecheck:all
pnpm build:all
```

根脚本已经默认切换为 monorepo 主线入口：

- `pnpm dev`
- `pnpm build`
- `pnpm typecheck`

旧版 `Vue3 + Vite` 站点脚本仍保留为：

- `pnpm legacy:dev`
- `pnpm legacy:build`
- `pnpm legacy:preview`
- `pnpm legacy:typecheck`

## 环境变量说明

当前仓库内提供了：

- [`.env.example`](./.env.example)

其中比较关键的变量有：

- `PORT`：NestJS 服务端口，默认 `5577`
- `CORS_ORIGINS`：允许访问后端的前端来源
- `NEXT_PUBLIC_API_BASE_URL`：浏览器访问后端的公开地址
- `RESUME_API_BASE_URL`：`apps/web` 服务端渲染时优先使用的后端地址
- `DATABASE_URL`：SQLite / libsql 连接串
- `JWT_SECRET`：JWT 签名密钥
- `AI_PROVIDER`：当前使用的 AI Provider

当前已支持的 Provider 入口：

- `mock`
- `qiniu`
- `deepseek`
- `openai-compatible`

## 阅读入口

- 文档首页：[`docs/README.md`](./docs/README.md)
- 文档导航：[`docs/00-文档导航.md`](./docs/00-%E6%96%87%E6%A1%A3%E5%AF%BC%E8%88%AA.md)
- 总方案：[`docs/10-架构设计/01-个人简历-monorepo-重构总方案-v1学习版.md`](./docs/10-%E6%9E%B6%E6%9E%84%E8%AE%BE%E8%AE%A1/01-%E4%B8%AA%E4%BA%BA%E7%AE%80%E5%8E%86-monorepo-%E9%87%8D%E6%9E%84%E6%80%BB%E6%96%B9%E6%A1%88-v1%E5%AD%A6%E4%B9%A0%E7%89%88.md)
- GitHub 开发流程：[`docs/20-研发流程/01-GitHub-标准开发流程.md`](./docs/20-%E7%A0%94%E5%8F%91%E6%B5%81%E7%A8%8B/01-GitHub-%E6%A0%87%E5%87%86%E5%BC%80%E5%8F%91%E6%B5%81%E7%A8%8B.md)
- 发布前检查：[`docs/40-部署上线/02-开源版发布前检查清单.md`](./docs/40-%E9%83%A8%E7%BD%B2%E4%B8%8A%E7%BA%BF/02-%E5%BC%80%E6%BA%90%E7%89%88%E5%8F%91%E5%B8%83%E5%89%8D%E6%A3%80%E6%9F%A5%E6%B8%85%E5%8D%95.md)
- ECS 手动部署脚本：[`deploy/ecs/README.md`](./deploy/ecs/README.md)
- ECS `stack.env` 填写清单：[`deploy/ecs/stack-env-checklist.md`](./deploy/ecs/stack-env-checklist.md)
- GitHub Actions 连接 ECS 发布说明：[`docs/40-部署上线/03-GitHub-Actions-连接-ECS-发布说明.md`](./docs/40-%E9%83%A8%E7%BD%B2%E4%B8%8A%E7%BA%BF/03-GitHub-Actions-%E8%BF%9E%E6%8E%A5-ECS-%E5%8F%91%E5%B8%83%E8%AF%B4%E6%98%8E.md)
- ECS 首次上线验收清单：[`docs/40-部署上线/04-ECS-首次上线验收清单.md`](./docs/40-%E9%83%A8%E7%BD%B2%E4%B8%8A%E7%BA%BF/04-ECS-%E9%A6%96%E6%AC%A1%E4%B8%8A%E7%BA%BF%E9%AA%8C%E6%94%B6%E6%B8%85%E5%8D%95.md)
- 系列文章目录：[`docs/40-教程与博客/README.md`](./docs/40-%E6%95%99%E7%A8%8B%E4%B8%8E%E5%8D%9A%E5%AE%A2/README.md)

## 发布前建议

如果你准备把当前仓库作为开源版正式发布，建议至少先看一遍：

- [`docs/40-部署上线/02-开源版发布前检查清单.md`](./docs/40-%E9%83%A8%E7%BD%B2%E4%B8%8A%E7%BA%BF/02-%E5%BC%80%E6%BA%90%E7%89%88%E5%8F%91%E5%B8%83%E5%89%8D%E6%A3%80%E6%9F%A5%E6%B8%85%E5%8D%95.md)
- [`docs/40-部署上线/01-Vercel-与-云服务器-最小部署说明.md`](./docs/40-%E9%83%A8%E7%BD%B2%E4%B8%8A%E7%BA%BF/01-Vercel-%E4%B8%8E-%E4%BA%91%E6%9C%8D%E5%8A%A1%E5%99%A8-%E6%9C%80%E5%B0%8F%E9%83%A8%E7%BD%B2%E8%AF%B4%E6%98%8E.md)

## 当前边界

当前开源版保持“小而稳”，明确不包含：

- 多模板简历系统
- JD 多版本定制简历
- 完整 AI 队列与任务中心
- 多租户 SaaS 能力
- 复杂后台设计系统

这些不是遗漏，而是显式后置到后续里程碑或独立产品线。

## License

`MIT`

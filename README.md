# my-resume

> 教程型全栈 Monorepo：从旧版 Vue 简历站，渐进重构为可开源、可部署、可继续演进的三端架构。

[English](./README.en.md)

[![CI](https://img.shields.io/github/actions/workflow/status/Fridolph/my-resume/ci.yml?branch=main&label=CI&logo=githubactions)](https://github.com/Fridolph/my-resume/actions/workflows/ci.yml)
[![Deploy ECS](https://img.shields.io/github/actions/workflow/status/Fridolph/my-resume/deploy-ecs.yml?branch=main&label=Deploy%20ECS&logo=githubactions)](https://github.com/Fridolph/my-resume/actions/workflows/deploy-ecs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](./.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-10.8.0-F69220?logo=pnpm&logoColor=white)](./package.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-000000?logo=nextdotjs)](./apps/web/package.json)
[![React](https://img.shields.io/badge/React-19.1.1-149eca?logo=react&logoColor=white)](./apps/web/package.json)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs&logoColor=white)](./apps/server/package.json)
[![HeroUI](https://img.shields.io/badge/HeroUI-3.0.1-4F46E5)](./apps/admin/package.json)
[![Coverage](https://img.shields.io/badge/Coverage-Vitest%20%28local%29-94a3b8)](#测试与质量)

## ✨ 项目定位

`my-resume` 是一个“边做边讲解”的实战仓库：

- 面向 **个人品牌 + 工程化简历产品** 的长期迭代
- 保持 **Issue 驱动、里程碑推进、可回滚** 的研发节奏
- 兼顾 **开发体验、部署可行性、教程产出**

当前主线已具备完整闭环：

- `web`：公开简历展示（双语、主题、导出入口）
- `admin`：后台编辑、发布、AI 工作台
- `server`：唯一业务后端（鉴权、简历、导出、AI/RAG）

## 🧭 在线地址（当前生产域名）

- Web：<https://resume.fridolph.top>
- Admin：<https://admin-resume.fridolph.top>
- API：<https://api-resume.fridolph.top>

## 🏗️ 架构总览

```text
apps/
  web/      Next.js 15 + React 19 公开端
  admin/    Next.js 15 + React 19 后台端
  server/   NestJS 11 + Drizzle + libsql/SQLite 后端

packages/
  api-client/  前后端共享请求契约
  ui/          共享 UI 样式与基础组件
  utils/       共享工具函数
  config/      共享配置

docs/
  00-文档导航.md
  10-架构设计/
  20-研发流程/
  30-开发日志/
  40-部署上线/
  40-教程与博客/
```

## 🧱 技术栈

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 15, React 19, HeroUI v3, Tailwind CSS v4 |
| Backend | NestJS 11, Drizzle ORM, libsql / SQLite |
| AI | 多 Provider（mock / qiniu / deepseek / openai-compatible）, RAG 最小链路 |
| Tooling | pnpm workspace, Turbo, Vitest, GitHub Actions, Docker Compose |

## 🚀 快速开始

### 1) 环境要求

- Node.js `22`（见 `./.nvmrc`）
- pnpm `10.8.0`

```bash
corepack enable
pnpm -v
node -v
```

### 2) 安装依赖

```bash
pnpm install --frozen-lockfile
```

### 3) 配置环境变量

```bash
cp .env.example .env
```

至少确认这些变量：

- `JWT_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `RESUME_API_BASE_URL`
- `AI_PROVIDER` 与对应 API Key

### 4) 启动开发环境

```bash
pnpm dev
```

默认端口：

- Web: <http://localhost:5555>
- Admin: <http://localhost:5566>
- Server: <http://localhost:5577>

可按端单独启动：

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:server
```

### 5) 本地默认演示账号

- `admin / admin123456`
- `viewer / viewer123456`

> 首次启动会自动写入数据库 `users` 表（仅保存密码哈希，不保存明文）。  
> 可通过 `.env` 中 `AUTH_ADMIN_PASSWORD` / `AUTH_VIEWER_PASSWORD` 覆盖默认密码。  
> 仅用于本地教程演示，生产环境请替换。

## 🐳 Docker 本地一键启动

```bash
cp .env.example .env
pnpm docker:up
```

停止：

```bash
pnpm docker:down
```

## 🧪 测试与质量

常用命令：

```bash
pnpm test          # workspace tests
pnpm test:e2e      # server e2e
pnpm typecheck:all
pnpm build:all
```

覆盖率：

```bash
pnpm --filter @my-resume/server test:cov
```

> 当前仓库使用 Vitest 本地生成覆盖率报告；Badge 暂为本地覆盖率模式（未接入外部覆盖率托管）。

## 📦 常用脚本（根目录）

| Command | Description |
| --- | --- |
| `pnpm dev` | 三端并行开发 |
| `pnpm build` | 全量构建 |
| `pnpm typecheck` | 全量类型检查 |
| `pnpm test:ci` | CI 同款测试入口（unit + e2e） |
| `pnpm docker:up` | Docker Compose 启动 |

## 🚢 部署文档

- [Vercel 与云服务器最小部署说明](./docs/40-部署上线/01-Vercel-与-云服务器-最小部署说明.md)
- [开源版发布前检查清单](./docs/40-部署上线/02-开源版发布前检查清单.md)
- [GitHub Actions 连接 ECS 发布说明](./docs/40-部署上线/03-GitHub-Actions-连接-ECS-发布说明.md)
- [ECS 首次上线验收清单](./docs/40-部署上线/04-ECS-首次上线验收清单.md)
- [ECS 部署脚本说明](./deploy/ecs/README.md)

## 📚 文档导航

- [文档首页](./docs/README.md)
- [文档导航](./docs/00-文档导航.md)
- [重构总方案（学习版）](./docs/10-架构设计/01-个人简历-monorepo-重构总方案-v1学习版.md)
- [研发流程规范](./docs/20-研发流程/01-GitHub-标准开发流程.md)
- [教程与博客目录](./docs/40-教程与博客/README.md)

## 🤝 贡献方式

欢迎提 Issue / PR。建议按以下流程协作：

1. 先建 Issue（背景 / 目标 / 非目标 / 验收 / 测试计划）
2. 从 `development` 开分支开发
3. 小步提交 + 测试验证 + 开发日志
4. CI 通过后再合并

详细规范见：

- [GitHub 标准开发流程](./docs/20-研发流程/01-GitHub-标准开发流程.md)
- [里程碑与 Issue 拆解建议](./docs/20-研发流程/02-里程碑与-Issue-拆解建议.md)

## 🗺️ 路线图

仓库采用里程碑式推进（M1 → M20+），每个阶段均有开发日志与教程沉淀。后续演进重点：

- AI 工作台持续体验优化
- RAG 能力增强与可观测性
- 更稳定的部署与发布自动化

## 📄 License

MIT © Fridolph

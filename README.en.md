# my-resume

> A tutorial-first full-stack monorepo that incrementally evolves a legacy Vue resume site into a production-ready multi-app architecture.

[中文说明](./README.md)

[![CI](https://img.shields.io/github/actions/workflow/status/Fridolph/my-resume/ci.yml?branch=main&label=CI&logo=githubactions)](https://github.com/Fridolph/my-resume/actions/workflows/ci.yml)
[![Deploy ECS](https://img.shields.io/github/actions/workflow/status/Fridolph/my-resume/deploy-ecs.yml?branch=main&label=Deploy%20ECS&logo=githubactions)](https://github.com/Fridolph/my-resume/actions/workflows/deploy-ecs.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](./.nvmrc)
[![pnpm](https://img.shields.io/badge/pnpm-10.8.0-F69220?logo=pnpm&logoColor=white)](./package.json)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-000000?logo=nextdotjs)](./apps/web/package.json)
[![React](https://img.shields.io/badge/React-19.1.1-149eca?logo=react&logoColor=white)](./apps/web/package.json)
[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs&logoColor=white)](./apps/server/package.json)
[![HeroUI](https://img.shields.io/badge/HeroUI-3.0.1-4F46E5)](./apps/admin/package.json)
[![Coverage](https://img.shields.io/badge/Coverage-Vitest%20%28local%29-94a3b8)](#testing--quality)

## ✨ Project Positioning

`my-resume` is built as a **learn-by-building** repository:

- focused on long-term evolution of a personal brand + engineering resume product,
- following an issue-driven and milestone-based workflow,
- balancing developer experience, deployability, and tutorial output.

Current core loop is production-usable:

- `web`: public resume experience (i18n, theme, export entries)
- `admin`: editing, publish workflow, AI workbench
- `server`: single business backend (auth, resume, export, AI/RAG)

## 🧭 Live Domains (current production)

- Web: <https://resume.fridolph.top>
- Admin: <https://admin-resume.fridolph.top>
- API: <https://api-resume.fridolph.top>

## 🏗️ Monorepo Structure

```text
apps/
  web/      Next.js 15 + React 19 public site
  admin/    Next.js 15 + React 19 admin panel
  server/   NestJS 11 + Drizzle + libsql/SQLite backend

packages/
  api-client/  shared request contracts
  ui/          shared UI styles and primitives
  utils/       shared utilities
  config/      shared configuration

docs/
  00-文档导航.md
  10-架构设计/
  20-研发流程/
  30-开发日志/
  40-部署上线/
  40-教程与博客/
```

## 🧱 Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 15, React 19, HeroUI v3, Tailwind CSS v4 |
| Backend | NestJS 11, Drizzle ORM, libsql / SQLite |
| AI | multi-provider (`mock` / `qiniu` / `deepseek` / `openai-compatible`) + minimal RAG chain |
| Tooling | pnpm workspace, Turbo, Vitest, GitHub Actions, Docker Compose |

## 🚀 Quick Start

### 1) Prerequisites

- Node.js `22` (see `./.nvmrc`)
- pnpm `10.8.0`

```bash
corepack enable
pnpm -v
node -v
```

### 2) Install dependencies

```bash
pnpm install --frozen-lockfile
```

### 3) Setup environment variables

```bash
cp .env.example .env
```

Minimum required values:

- `JWT_SECRET`
- `DATABASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `RESUME_API_BASE_URL`
- `AI_PROVIDER` and corresponding API keys

### 4) Start local development

```bash
pnpm dev
```

Default ports:

- Web: <http://localhost:5555>
- Admin: <http://localhost:5566>
- Server: <http://localhost:5577>

Run apps independently:

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:server
```

### 5) Local demo accounts

- `admin / admin123456`
- `viewer / viewer123456`

> On first boot, these users are persisted in the `users` table with password hashes only (no plaintext storage).  
> Override defaults via `AUTH_ADMIN_PASSWORD` / `AUTH_VIEWER_PASSWORD` in `.env`.  
> For local tutorial use only. Replace credentials before public deployment.

## 🐳 Docker (local one-command startup)

```bash
cp .env.example .env
pnpm docker:up
```

Stop:

```bash
pnpm docker:down
```

## 🧪 Testing & Quality

Common commands:

```bash
pnpm test
pnpm test:e2e
pnpm typecheck:all
pnpm build:all
```

Coverage:

```bash
pnpm --filter @my-resume/server test:cov
```

> Coverage reports are currently generated locally with Vitest. Coverage badge is shown as local mode (no external coverage hosting yet).

## 📦 Useful Scripts (root)

| Command | Description |
| --- | --- |
| `pnpm dev` | start all main apps for development |
| `pnpm build` | full workspace build |
| `pnpm typecheck` | full workspace typecheck |
| `pnpm test:ci` | CI-equivalent test entrypoint (unit + e2e) |
| `pnpm docker:up` | start with Docker Compose |

## 🚢 Deployment Docs

- [Minimal Vercel + Cloud Server Deployment Guide](./docs/40-部署上线/01-Vercel-与-云服务器-最小部署说明.md)
- [Open Source Release Checklist](./docs/40-部署上线/02-开源版发布前检查清单.md)
- [GitHub Actions to ECS Deployment Guide](./docs/40-部署上线/03-GitHub-Actions-连接-ECS-发布说明.md)
- [ECS First-Go-Live Acceptance Checklist](./docs/40-部署上线/04-ECS-首次上线验收清单.md)
- [ECS Script Docs](./deploy/ecs/README.md)

## 📚 Documentation Entry

- [Docs Home](./docs/README.md)
- [Docs Navigation](./docs/00-文档导航.md)
- [Monorepo Refactor Master Plan](./docs/10-架构设计/01-个人简历-monorepo-重构总方案-v1学习版.md)
- [Engineering Workflow](./docs/20-研发流程/01-GitHub-标准开发流程.md)
- [Tutorial Index](./docs/40-教程与博客/README.md)

## 🤝 Contributing

Contributions via Issues/PRs are welcome. Recommended workflow:

1. Open an issue first (background, goal, non-goals, acceptance, test plan)
2. Branch from `development`
3. Small commits + tests + dev logs
4. Merge only after CI passes

Workflow references:

- [GitHub Standard Workflow](./docs/20-研发流程/01-GitHub-标准开发流程.md)
- [Milestone & Issue Breakdown Guide](./docs/20-研发流程/02-里程碑与-Issue-拆解建议.md)

## 🗺️ Roadmap

This repository advances through milestone-based iterations (M1 → M20+), with dev logs and tutorial artifacts for each phase.

Near-term focus:

- AI workbench UX refinement
- RAG capabilities and observability
- more stable release/deployment automation

## 📄 License

MIT © Fridolph

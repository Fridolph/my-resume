# M20-issue-178：ECS 三端常驻与 Next standalone 镜像优化

- Issue：M20 / ECS 三端常驻与 Next standalone 镜像优化
- 里程碑：M20
- 分支：`main`
- 日期：2026-04-16

## 背景

当前 ECS 方案已经明确采用：

- `resume.fridolph.top` → `web`
- `resume-admin.fridolph.top` → `admin`
- `resume-api.fridolph.top` → `server`

三端都通过 Docker Compose 常驻，并由 Nginx 统一反代。  
在这个前提下，`web` / `admin` 继续使用单阶段 Dockerfile 会把整仓源码、安装缓存和运行时一起塞进镜像，镜像偏重，也不够接近线上推荐的 Next.js 生产形态。

## 本次目标

- 将 `web` / `admin` 收口到 Next.js `standalone` 生产输出。
- 将 `server` 收口到更轻量的多阶段镜像，避免运行镜像继续携带整仓源码。
- 补充 `.dockerignore` 与部署文档，让 ECS 三端常驻方案更明确、更易维护。

## 非目标

- 不将 `web` / `admin` 改成静态导出站点。
- 不调整业务路由、API 协议或页面渲染逻辑。
- 不重构 ECS 的整体目录结构与发布流程。

## TDD / 测试设计

- 先执行 `web` / `admin` 生产构建，确认 `standalone` 产物能正确生成。
- 检查 `standalone` 目录中的实际 `server.js` 路径，避免 Docker 启动命令写错。
- 执行 `server` 构建与 `deploy/ecs/*.sh` 的 shell 语法检查，保证部署链路不被 Dockerfile 调整破坏。

## 实际改动

- `apps/web/next.config.ts`
  - 新增 `output: 'standalone'`
  - 新增 `outputFileTracingRoot` 指向 monorepo 根目录
- `apps/admin/next.config.ts`
  - 同步切到 `standalone`
  - 同步补 monorepo tracing root
- `apps/web/Dockerfile`
  - 改为 `builder + runner` 多阶段镜像
  - 运行时只复制 `.next/standalone`、`.next/static`、`public`
- `apps/admin/Dockerfile`
  - 同步改为 `standalone` 多阶段镜像
- `apps/server/Dockerfile`
  - 改为更轻的多阶段镜像
  - 运行时只保留 `dist` 与必要依赖
- `.dockerignore`
  - 增加 `**/.next`、`**/dist`、`**/coverage`，减少构建上下文

## Review 记录

- 当前 `web` / `admin` 都依赖 Next 运行时，不适合这轮改成纯静态导出；继续保留 `next build + node server.js` 是更稳妥的生产路线。
- 对 monorepo 来说，`outputFileTracingRoot` 是关键；不补这个配置，`standalone` 很容易漏掉工作区共享包。
- `server` 仍走 Node 常驻，但运行镜像不再需要带整仓源码，符合 ECS 三端常驻的实际需要。

## 自测结果

- `pnpm --filter @my-resume/web build`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server build`
- `bash -n deploy/ecs/lib.sh deploy/ecs/bootstrap.sh deploy/ecs/render-config.sh deploy/ecs/release.sh deploy/ecs/rollback.sh`
- 额外检查：
  - `apps/web/.next/standalone/apps/web/server.js`
  - `apps/admin/.next/standalone/apps/admin/server.js`

## 遇到的问题

- 本机环境没有安装 Docker，无法直接做镜像级冒烟构建；因此本轮以产物路径检查和构建成功作为本地验证主线。
- Next standalone 在 monorepo 下不会默认追踪工作区根目录，必须显式声明 `outputFileTracingRoot`。

## 可沉淀为教程/博客的点

- 为什么 `next build + next start` 已经是生产形态，而不是 dev server
- 在 monorepo 中如何正确启用 Next standalone
- 三端常驻 + Nginx 反代 与 “前端静态站 + 后端常驻” 两种部署思路该怎么选

## 后续待办

- 等服务器 Docker 环境稳定后，可再补一轮镜像体积对比与启动时间记录。
- 如果后续需要进一步压缩镜像，可评估 `server` 是否引入更彻底的依赖裁剪方案。

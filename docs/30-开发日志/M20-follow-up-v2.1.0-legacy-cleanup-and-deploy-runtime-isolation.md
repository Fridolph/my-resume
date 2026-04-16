# M20 follow-up：`v2.1.0` 旧版清理与部署运行时隔离

## 背景

仓库已经稳定切到 `apps/web + apps/admin + apps/server + packages/*` 的 Monorepo 主线，但根目录还残留旧版 `Vue3 + Vite` 的 `src/` 与相关脚本、依赖、配置文件，容易让后续维护和部署产生混淆。

同时，ECS 发布脚本原先默认把运行时产物落在 `repo/`、`releases/`、`shared/`、`current/` 这类目录名下；当部署根目录本身就是 Git 仓库工作区时，目录语义与 `.gitignore` 管理都不够清晰。

## 本次目标

- 删除旧版根目录 Vue 应用及其遗留依赖、配置和脚本引用。
- 将 ECS 运行时目录统一收口到 `.deploy-runtime/` 下，避免污染仓库根目录。
- 同步 README、部署说明与验收文档，确保 `v2.1.0` 起的部署路径一致。

## 实际改动

- 删除根目录旧版文件：
  - `src/`
  - `index.html`
  - `vite.config.ts`
  - `tailwind.config.cjs`
  - `postcss.config.cjs`
  - `tsconfig.json`
  - `tsconfig.node.json`
- 清理根目录 `package.json` 中不再使用的 Vue/Vite 依赖与脚本。
- 更新 `scripts/check-workspace.mjs`，移除对旧版根目录入口的检查。
- 将部署运行时目录改为：
  - `.deploy-runtime/repo-cache`
  - `.deploy-runtime/release-snapshots`
  - `.deploy-runtime/shared`
  - `.deploy-runtime/current`
- 默认运行时配置文件使用 `.deploy-runtime/shared/config/stack.env.local`，并兼容旧的 `shared/config/stack.env.local` 与 `stack.env` 兜底读取。
- Certbot 申请 / 续签显式传入 `CERTBOT_KEY_TYPE`，默认 `ecdsa`，避免已有 ECDSA 证书被误判为切换到 RSA。
- Certbot 验证改为 `certonly --webroot`，避免 nginx 插件临时改写配置时被旧 HTTPS 站点返回 404。
- Certbot webroot 默认改为 `/var/www/my-resume-certbot`，避免部署根在 `/root` 时 Nginx 无法读取 challenge 文件导致 `403`。
- Certbot 执行前加入 HTTP ACME challenge 自检，提前暴露 301 / 403 / 404 等 Nginx 路由问题。
- 发布同名 tag 时会重新生成 release snapshot，避免调试阶段 tag 更新后继续复用旧快照。
- 在 `.gitignore` 中加入 `/.deploy-runtime/`。
- 修正文档中的生产域名与部署路径示例，统一以 `v2.1.0` 和当前目录结构为准。

## Review 记录

- 本轮只处理“旧版遗留清理 + 部署运行时路径隔离”，不扩展到业务功能和界面调整。
- 历史教程 / 开发日志中对旧版文件的回顾性描述保留，不强行重写，以免破坏教程阶段记录。
- 当前运行时目录隐藏到仓库根下，既避免 `.gitignore` 误伤，也保留了单目录部署的简单心智模型。

## 遇到的问题

- 旧版 `src/assets/iconfont/iconfont.ttf` 为二进制文件，`apply_patch` 无法直接删除，因此改为使用 `git rm -r` 执行清理。

## 测试与验证

- 已执行：
  - `pnpm install`
  - `pnpm test:workspace`
  - `pnpm build:shared`
  - `pnpm --filter @my-resume/web build`
  - `pnpm --filter @my-resume/admin build`
  - `pnpm --filter @my-resume/server build`
  - `bash -n deploy/ecs/lib.sh deploy/ecs/bootstrap.sh deploy/ecs/render-config.sh deploy/ecs/release.sh deploy/ecs/rollback.sh`

## 后续可写教程 / 博客切入点

- 单仓库部署时，为什么要把“工作区”和“运行时产物目录”拆开。
- 从旧版单页应用过渡到 Monorepo 时，如何判断哪些根目录遗留该删、哪些文档记录该保留。

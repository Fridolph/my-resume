# M20 follow-up：`v2.0.0` ECS 部署脚本方案

## 背景

当前仓库已经完成 `main` 上 `v2.0.0` 的阶段性收口，接下来需要在个人 ECS 上完成一套**可手动验证、可逐步演进到 GitHub Actions 自动部署**的发布脚本方案。

## 本次目标

- 固定 `main` 上的 `v2.0.0` tag 作为部署来源
- 落地 `single ECS + Docker Compose + Nginx + HTTPS + 三子域名` 的脚本骨架
- 保持脚本支持手工执行与未来 CI 复用
- 提前预埋 release / rollback 结构，避免后续再推翻

## 实际改动

- 新增 `deploy/ecs/bootstrap.sh`
- 新增 `deploy/ecs/render-config.sh`
- 新增 `deploy/ecs/release.sh`
- 新增 `deploy/ecs/rollback.sh`
- 新增 `.github/workflows/deploy-ecs.yml`
- 新增 `deploy/ecs/stack-env-checklist.md`
- 新增 `docs/40-部署上线/03-GitHub-Actions-连接-ECS-发布说明.md`
- 新增 `docs/40-部署上线/04-ECS-首次上线验收清单.md`
- 新增 `deploy/templates/stack.env.example`
- 新增生产版 `compose.prod.yml` / Nginx 模板
- 新增 `deploy/ecs/README.md` 说明手工部署与回滚流程
- 修复 PR CI 暴露出的测试环境问题：PDF 文本抽取断言、测试用 `localStorage` mock、e2e 全局 `/api` 前缀与新版导出文案断言
- `README.md` 增加 ECS 部署脚本入口
- `.gitignore` 忽略本地 `deploy/ecs/stack.env`

## Review 记录

- 本轮只做部署脚本与模板，不修改业务代码和运行时接口
- 延续当前 `web=5555 / admin=5566 / server=5577` 端口约定
- 保持现有 `origin: true` CORS 行为，不把上线前安全收口混入本次 issue
- 首版证书策略采用 `certbot --nginx`，优先验证 `v2.0.0` 的手工发布可行性

## 遇到的问题

- Nginx 证书文件在首次部署前不存在，因此需要先装载 HTTP 配置，再申请证书，最后切换到 HTTPS 配置
- Compose 与未来 CI/CD 共用时，发布目录与当前工作目录不能耦合，因此额外设计了 `/opt/my-resume/releases/<tag>` 与 `/opt/my-resume/current`

## 测试与验证

- 计划执行脚本语法检查
- 计划本地 dry-run 渲染 `compose.prod.yml` / `nginx.conf`
- 计划检查 GitHub Actions workflow 的 YAML 结构与 Secrets 契约
- 已补跑 `pnpm test:ci`
- 首次 ECS 验证以 `bootstrap -> render-config -> release v2.0.0` 为主线

## 后续可写成教程 / 博客的切入点

- 为什么教程型 monorepo 先落“可手动验证的发布脚本”，再接 GitHub Actions
- 单机 ECS 上如何用 release 目录 + current 软链预埋回滚能力
- 从 Docker Compose 手工发布平滑升级到 CI/CD 的最小路径

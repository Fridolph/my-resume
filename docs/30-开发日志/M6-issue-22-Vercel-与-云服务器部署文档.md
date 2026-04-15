# M6 / issue-22 Vercel 与云服务器部署文档

- Issue：`#29`
- 里程碑：`M6 测试、CI/CD、部署：从本地到上线`
- 分支：`feat/m6-issue-22-deploy-docs`
- 日期：`2026-03-25`

## 背景

`issue-20` 和 `issue-21` 已经把本地质量门禁与远端 CI 跑通。  
如果缺少部署文档，读者依然只能停留在“本地可跑”，无法真正把 `web / admin / server` 这三端拉通到线上。

## 本次目标

- 输出 `web / admin` 部署到 `Vercel` 的最小说明
- 输出 `server` 部署到云服务器的最小说明
- 补齐环境变量、构建、启动、反向代理与验收清单

## 非目标

- 不做自动化 IaC
- 不绑定单一云厂商
- 不展开 HTTPS / 监控 / 日志平台的完整运维体系

## TDD / 文档前确认

在落文档前，先按仓库现状核对了：

- `apps/server` 默认监听端口：`3001`
- `apps/server` 环境变量读取顺序：根目录 `.env.production.local` 等
- `apps/web` 依赖：
  - `RESUME_API_BASE_URL`
  - `NEXT_PUBLIC_API_BASE_URL`
- `apps/admin` 依赖：
  - `NEXT_PUBLIC_API_BASE_URL`
- `apps/server` 当前跨域行为：
  - `origin: true`
- 根目录已有 `.env.example`

## 实际改动

### 部署文档

- 新增 `docs/40-部署上线/01-Vercel-与-云服务器-最小部署说明.md`
- 覆盖：
  - 推荐部署拓扑
  - 三端环境变量
  - `web / admin` 的 Vercel 配置
  - `server` 的云服务器部署
  - `PM2 + Nginx` 最小方案
  - 上线验收清单

### 文档导航

- 保持 `docs/00-文档导航.md` 与当前文档体系一致

### M6 教程沉淀

- 补一份 `M6` 教程大纲，避免里程碑收尾后结构散掉

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做：

- 部署文档
- 文档导航更新
- 里程碑级教程沉淀

没有提前进入：

- 自动化部署脚本
- 云厂商专属实现
- 运维体系深水区

### Review 结论

- 通过
- 可进入文档校对与提交流程

## 自测与校对

- 对照 `apps/server/src/main.ts`
- 对照 `apps/server/src/config/env-paths.ts`
- 对照 `.env.example`
- 对照 `apps/web/README.md`
- 对照 `apps/web/lib/env.ts`
- 对照 `apps/admin/lib/env.ts`
- 对照各应用 `package.json` 的构建 / 启动脚本

## 后续待办

- 关闭 `M6`
- 输出 `M6` 里程碑总结或正式教程
- 进入下一阶段的页面设计与部署细化

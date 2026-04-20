# M20 Issue 201 - web/admin 启动日志与版本追踪

## 背景
线上仍出现 `Failed to fetch`，需要在浏览器端快速确认：
- 当前页面跑的是哪个版本
- 请求默认 API Base URL 是什么
- 当前页面地址与 locale

用于判断是部署版本未生效、缓存命中旧包，还是环境变量配置错误。

## 本次目标
- 在 `web` 与 `admin` 两端增加简洁启动日志（`console.log`）
- 日志包含：应用标识、版本号、API Base URL、href、locale
- 构建链路将发布 tag 注入前端版本变量，便于线上核对

## 实际改动
- `apps/web/app/web-locale-providers.tsx`
  - 新增浏览器端启动日志（按 `web:${locale}` 去重，避免重复刷屏）
- `apps/admin/app/providers.tsx`
  - 新增浏览器端启动日志（按 `admin:${locale}` 去重）
- `apps/web/app/_core/env.ts`
  - 新增 `APP_VERSION`
- `apps/admin/app/_core/env.ts`
  - 新增 `APP_VERSION`
- `apps/web/next.config.ts`
  - 将 `NEXT_PUBLIC_APP_VERSION` 注入 Next env（优先外部 env，兜底 package version）
- `apps/admin/next.config.ts`
  - 同上
- `apps/web/Dockerfile` / `apps/admin/Dockerfile`
  - 增加 `ARG/ENV NEXT_PUBLIC_APP_VERSION`
- `deploy/ecs/build-and-push-images.sh`
  - build 参数新增 `NEXT_PUBLIC_APP_VERSION=$TAG`（web/admin）

## Review 记录
- 采用最小侵入策略：只在全局 Provider 层打一次启动日志，不改业务请求逻辑
- 版本注入与部署 tag 绑定，排查时可直接对比控制台与发布版本

## 测试与验证
- 类型检查：
  - `cd apps/web && ../../node_modules/.bin/tsc --noEmit --incremental false`
  - `cd apps/admin && ../../node_modules/.bin/tsc --noEmit --incremental false`
- 构建脚本 dry-run：
  - 不传 `--public-api-base-url` 路径通过
  - 传入 `--public-api-base-url` 路径通过
  - 命令中确认包含 `--build-arg NEXT_PUBLIC_APP_VERSION=v2.2.8`

## 后续可写教程切入点
- 前端启动日志的“诊断级最小信息集”设计
- 如何把发布 tag 打通到 Next 客户端环境变量用于线上定位

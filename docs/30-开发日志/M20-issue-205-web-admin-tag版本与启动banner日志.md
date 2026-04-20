# M20 Issue 205 - web/admin tag 版本与启动 banner 日志

## 背景
当前 `web/admin` 启动日志中的版本值来自 `package.json`（0.0.1），不利于线上快速判断是否命中目标发布版本。

## 本次目标
- 启动日志版本优先显示发布 tag
- 在启动日志前增加 ASCII banner
- 将 workspace 各 `package.json` 版本同步到当前发布版本（2.2.8）

## 实际改动
- `apps/web/next.config.ts`
- `apps/admin/next.config.ts`
  - 版本策略改为：
    1. `NEXT_PUBLIC_APP_VERSION`
    2. `git tag --sort=-v:refname | head -n 1`
    3. `package.json version`
- `apps/web/app/web-locale-providers.tsx`
- `apps/admin/app/providers.tsx`
  - 在 boot log 前新增 ASCII banner `console.log`
- 版本号同步：
  - 根 `package.json`
  - `apps/*/package.json`
  - `packages/*/package.json`
  - 统一更新为 `2.2.8`

## 测试与验证
- `cd apps/web && ../../node_modules/.bin/tsc --noEmit --incremental false`
- `cd apps/admin && ../../node_modules/.bin/tsc --noEmit --incremental false`
- `git tag --sort=-v:refname | head -n 1` 输出 `v2.2.8`

## 后续建议
- 后续每次发版后，同步 bump workspace package 版本
- 保持部署脚本传入 `NEXT_PUBLIC_APP_VERSION=$TAG`，确保线上严格与发布版本一致

# M21 / issue-209 开发日志：auth users 表与密码哈希鉴权

## 背景

- 当前登录链路依赖内存常量 `DEMO_ACCOUNTS`，用户名/密码明文比对。
- 该模式不满足长期演进需求：无法沉淀真实用户表，也不具备密码哈希存储能力。

## 本次目标

- 新增数据库 `users` 表，承载 `admin/viewer` 用户信息。
- 登录改为数据库用户 + 密码哈希校验。
- 保持现有 `/api/auth/login`、`/api/auth/me` 响应契约不破坏。
- 补齐 e2e 运行稳定性（并发时 SQLite 锁冲突隔离）。

## 实际改动

- 数据模型：
  - `apps/server/src/database/schema.ts` 新增 `users` 表（`username` 唯一、`password_hash`、`role`、`is_active`、`last_login_at`、时间戳）。
  - `apps/server/src/database/__tests__/schema.spec.ts` 增加 `users` 表结构断言。
- 鉴权后端：
  - `AuthService` 改为读取数据库用户，并使用哈希校验密码。
  - `verifyAccessToken` 改为按用户表恢复用户上下文，不再依赖内存账号常量。
  - 新增 `AuthUserRepository`（`users` 表查询/创建/更新登录时间）。
  - 新增 `PasswordHashService`（`scrypt` 哈希与校验）。
  - 新增 `AuthUserSeedService`（启动时补齐默认 admin/viewer，并支持 env 覆盖）。
- 测试与运行稳定性：
  - 新增 `auth-user-seed.service` 与 `password-hash.service` 单测。
  - auth 相关 e2e 用例改为临时独立数据库文件，避免并发执行时锁冲突。
  - 新增 `apps/server/test/helpers/temp-database-env.ts` 统一 e2e 数据库隔离。
- 配置与文档：
  - `.env.example`、`deploy/templates/stack.env.example`、`deploy/ecs/stack-env-checklist.md` 增加 `AUTH_*` 配置说明。
  - `README.md` / `README.en.md` 增加“用户落库 + 仅保存密码哈希”的说明。

## Review 记录

- 范围控制：仅处理当前 issue 的鉴权持久化升级，不扩展到 OAuth / 全量 RBAC 后台。
- 兼容性：保留现有接口响应结构，前端无需本轮同步改动即可继续工作。

## 遇到的问题

- e2e 并发运行时，多个 suite 共享默认 SQLite 文件，启动期 DDL/seed 触发 `SQLITE_BUSY`。
- 处理方式：e2e 统一切换到每个 suite 独立临时 DB 文件，消除共享写锁竞争。

## 测试与验证

- `pnpm --filter @my-resume/server test -- src/modules/auth/__tests__/auth.service.spec.ts src/modules/auth/__tests__/password-hash.service.spec.ts src/modules/auth/__tests__/auth-user-seed.service.spec.ts src/database/__tests__/schema.spec.ts` ✅
- `pnpm --filter @my-resume/server typecheck` ✅
- `pnpm --filter @my-resume/server test:e2e` ✅（9 files / 26 tests 全通过）

## 后续可写教程/博客切入点

- 教程主题：从 demo 常量鉴权迁移到 `users` 表的渐进式改造。
- 可重点讲解：
  - 为什么“哈希存储 + DB 用户表”是最小安全基线；
  - 如何在不破坏前端契约的情况下替换后端鉴权来源；
  - 如何处理 e2e 的 SQLite 并发锁问题。

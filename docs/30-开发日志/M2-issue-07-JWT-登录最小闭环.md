# M2 / issue-07 JWT 登录最小闭环

- Issue：`#13`
- 里程碑：`M2 鉴权与角色：最小登录闭环`
- 分支：`feat/m2-issue-07-jwt-login`
- 日期：`2026-03-24`

## 背景

`issue-06` 已经把 `admin / viewer` 的角色模型和权限边界固定下来。  
下一步需要让 `apps/server` 先具备最小登录能力，形成“登录 → 签发 token → 访问受保护接口”的闭环，作为后续 `apps/admin` 登录壳和 viewer 只读体验的基础。

## 本次目标

- 提供最小登录接口
- 签发可校验的 JWT 访问令牌
- 提供最小受保护接口，验证登录态
- 保持当前阶段不接数据库，先用 demo 账号完成教学闭环

## 非目标

- 不接数据库持久化
- 不实现刷新令牌复杂策略
- 不接前端完整页面
- 不引入 Passport 体系的完整封装

## TDD / 测试设计

### 单元测试

- 新增 `apps/server/src/modules/auth/auth.service.spec.ts`
- 先描述两个核心行为：
  - demo `admin` 账号登录成功并返回 token
  - 非法凭证登录失败

### E2E 测试

- 新增 `apps/server/test/auth.e2e-spec.ts`
- 先描述四个闭环场景：
  - `POST /auth/login` 成功登录
  - 非法凭证返回 `401`
  - 带 `Bearer Token` 访问 `GET /auth/me` 成功
  - 未携带 token 访问受保护接口返回 `401`

### 首次失败记录

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/auth/auth.service.spec.ts`
- 结果：失败
- 原因：缺少 `AuthService`

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/auth.e2e-spec.ts`
- 结果：失败
- 原因：`/auth/login` 与 `/auth/me` 路由尚未实现

## 实际改动

- 新增 `AuthController`
  - `POST /auth/login`
  - `GET /auth/me`
- 新增 `AuthService`
  - 内存 demo 账号校验
  - JWT 签发
  - token 校验与用户恢复
- 新增 `JwtAuthGuard`
  - 从 `Authorization` 头中提取 `Bearer Token`
  - 拒绝缺失或非法 token
- 新增 `CurrentAuthUser` 装饰器
- 新增 `LoginDto`
- 新增认证相关接口类型：
  - `AuthTokenPayload`
  - `AuthenticatedRequest`
- 在 `AuthModule` 中引入 `@nestjs/jwt`
- 增加 `@nestjs/jwt` 依赖

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做了：

- 最小登录接口
- 最小 JWT 签发与校验
- 最小受保护接口
- 以 demo 账号完成后端闭环

没有提前进入：

- 数据库存储
- 刷新令牌
- 前端登录页
- `viewer` 页面体验细化

### 是否存在可继续抽离的点

- `DEMO_ACCOUNTS` 后续可迁移到基础设施层或配置层
- 当前阶段保持放在 `AuthService` 内更利于教学，暂不继续抽离
- `JwtAuthGuard`、`CurrentAuthUser` 已沉淀为可复用的最小认证基础件

### Review 结论

- 通过
- 进入自测

## 自测结果

### 1. `AuthService` 单测

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/auth/auth.service.spec.ts`
- 结果：通过

### 2. 认证闭环 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/auth.e2e-spec.ts`
- 结果：通过

### 3. `apps/server` 全量单测

- `pnpm --filter @my-resume/server exec jest --runInBand`
- 结果：通过

### 4. `apps/server` 全量 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand`
- 结果：通过

### 5. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

### 6. 根级验证

- `pnpm run typecheck`
- 结果：通过
- `pnpm run build`
- 结果：通过
- 备注：根项目构建仍提示 `tailwind.config.cjs` 的 ESM warning，但与本次任务无关，且构建成功

## 遇到的问题

### 1. `NestJS` 装饰器元数据与类型导入冲突

- 现象：`AuthController` 构建时报 `TS1272`
- 原因：在 `isolatedModules + emitDecoratorMetadata` 下，装饰器签名里的类型需要 `import type`
- 处理：将 `AuthUser` 改为类型导入

### 2. 当前登录实现容易过度设计

- 风险：为了“更完整”而过早引入数据库、刷新令牌、Passport
- 处理：本轮只保留 demo 账号 + JWT 最小闭环，优先保证教程节奏

## 可沉淀为教程 / 博客的点

- 为什么在教程型项目里先做“最小登录闭环”，而不是一口气上完整鉴权体系
- 不接数据库时，如何用 demo 账号完成 JWT 教学验证
- `NestJS` 中不依赖 Passport 也能跑通最小 JWT 闭环
- 如何用单测 + E2E 把登录行为先锁住再实现

## 后续待办

- 继续 `issue-08`：`apps/admin` 最小登录壳

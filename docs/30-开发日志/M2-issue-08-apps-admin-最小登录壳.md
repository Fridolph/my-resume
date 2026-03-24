# M2 / issue-08 apps-admin 最小登录壳

- Issue：`#12`
- 里程碑：`M2 鉴权与角色：最小登录闭环`
- 分支：`feat/m2-issue-08-admin-login-shell`
- 日期：`2026-03-24`

## 背景

`issue-07` 已在 `apps/server` 中完成最小 JWT 登录闭环。  
接下来需要把后台管理端的最小前端壳搭起来，让“输入账号密码 → 调用 `NestJS` 登录接口 → 保存 token → 访问受保护页面”这条链路真正跑通。

## 本次目标

- 创建 `apps/admin` 最小 `Next.js App Router` 应用
- 提供最小登录页
- 调用 `apps/server` 的 `/auth/login` 和 `/auth/me`
- 提供最小受保护页面壳

## 非目标

- 不实现完整后台 UI
- 不接内容管理功能
- 不引入复杂状态管理
- 不在 `Next Route Handlers` 中编写业务逻辑

## TDD / 测试设计

### 单元测试

- 新增 `apps/admin/lib/auth-api.spec.ts`
  - 调用 `/auth/login` 成功返回登录结果
  - 调用 `/auth/me` 时带上 `Bearer Token`
- 新增 `apps/admin/lib/session-storage.spec.ts`
  - token 写入本地存储
  - token 清理正常
- 新增 `apps/admin/components/login-form.spec.tsx`
  - 登录表单可以提交用户名与密码
  - 登录失败时显示错误消息

### 首次失败记录

- `pnpm --filter @my-resume/admin test`
- 结果：失败
- 原因：
  - 缺少 `auth-api`
  - 缺少 `session-storage`
  - 缺少 `LoginForm`

## 实际改动

### `apps/admin`

- 新建 `package.json`
- 新建 `Next.js App Router` 最小骨架：
  - `app/layout.tsx`
  - `app/page.tsx`
  - `app/dashboard/page.tsx`
  - `app/globals.css`
- 新建登录与受保护壳组件：
  - `AdminLoginShell`
  - `AdminDashboardShell`
  - `LoginForm`
- 新建最小前端认证能力：
  - `auth-api`
  - `auth-types`
  - `session-storage`
  - `env`
- 新建 `vitest` 测试配置

### `apps/server`

- 在 `main.ts` 中启用最小 CORS
- 目的：允许本地 `apps/admin` 直接从浏览器调用 `apps/server`

### 其他

- 更新 `apps/admin/README.md`
- 更新 `.gitignore`，忽略 `.next` 与 `*.tsbuildinfo`

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做了：

- 最小 `admin` 前端壳
- 最小登录页
- 最小 token 存储
- 最小受保护页面壳
- 与 `apps/server` 的真实接口联调

没有提前进入：

- 内容管理页面
- React Query / 表单库接入
- 后台布局系统
- 业务逻辑下沉到 Next 服务端

### 是否存在可继续抽离的点

- `auth-api` 与 `session-storage` 已经形成最小可复用边界
- 后续可把当前登录态逻辑继续抽为 `useAdminSession`
- 当前阶段先保持直白实现，更适合教程讲解

### Review 结论

- 通过
- 可进入自测

## 自测结果

### 1. `apps/admin` 单测

- `pnpm --filter @my-resume/admin test`
- 结果：通过

### 2. `apps/admin` 类型检查

- `pnpm --filter @my-resume/admin typecheck`
- 结果：通过

### 3. `apps/admin` 构建

- `pnpm --filter @my-resume/admin build`
- 结果：通过
- 备注：构建时出现 Tailwind `content` warning，但本轮未接入 Tailwind，且不影响产物生成

### 4. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

### 5. 真实联调验证

- 启动：
  - `pnpm --filter @my-resume/server start`
  - `pnpm --filter @my-resume/admin dev --hostname 127.0.0.1 --port 3000`
- 浏览器访问：`http://127.0.0.1:3000`
- 使用 demo 账号 `admin / admin123456`
- 结果：
  - 登录成功
  - 成功跳转 `/dashboard`
  - 成功显示当前用户与角色能力

## 遇到的问题

### 1. 真实联调时会遇到跨端请求问题

- 现象：`admin` 页面通过浏览器直接请求 `server`
- 风险：没有最小 CORS 时，单测能过，但浏览器联调会失败
- 处理：在 `apps/server/src/main.ts` 开启最小 CORS

### 2. `vitest` 默认 JSX 运行时不兼容当前测试写法

- 现象：组件测试报 `React is not defined`
- 处理：在 `vitest.config.ts` 中启用自动 JSX 运行时

### 3. `Next.js` 构建会生成本地缓存文件

- 现象：出现 `.next` 与 `tsbuildinfo`
- 处理：补充 `.gitignore`

## 可沉淀为教程 / 博客的点

- 为什么管理端先做“登录壳”，而不是直接上完整后台系统
- `Next.js` 前端如何只做壳层，不承载业务后端职责
- 最小 JWT 登录如何在真实浏览器环境中打通
- 为什么联调阶段一定要做一次真实浏览器验证，而不是只看单测

## 后续待办

- 继续 `issue-09`：viewer 只读守卫与体验

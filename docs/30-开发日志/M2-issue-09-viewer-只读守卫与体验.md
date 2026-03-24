# M2 / issue-09 viewer 只读守卫与体验

- Issue：`#15`
- 里程碑：`M2 鉴权与角色：最小登录闭环`
- 分支：`feat/m2-issue-09-viewer-readonly`
- 日期：`2026-03-24`

## 背景

`issue-08` 已完成 `apps/admin` 最小登录壳，但目前“viewer 只能读、不能写、不能触发敏感动作”的边界还只是角色能力定义，没有真正落到接口守卫和页面体验里。  
本轮要把这条边界正式落地，避免后续内容管理、发布、AI 工具链接入时角色语义再次分叉。

## 本次目标

- 在 `apps/server` 落地最小角色能力守卫
- 明确 `viewer` 可读、不可写、不可触发敏感动作
- 在 `apps/admin` 最小后台壳中体现只读限制

## 非目标

- 不进入真实内容发布实现
- 不进入 AI 能力实现
- 不进入缓存报告实现
- 不扩展完整后台功能

## TDD / 测试设计

### `apps/server`

- 新增 `apps/server/test/auth-viewer-access.e2e-spec.ts`
- 先描述四个场景：
  - `viewer` 可访问只读体验接口
  - `viewer` 调用发布动作返回 `403`
  - `viewer` 调用 AI 动作返回 `403`
  - `admin` 可执行两个敏感动作

### `apps/admin`

- 扩展 `apps/admin/lib/auth-api.spec.ts`
  - 最小受保护动作请求必须携带 `Bearer Token`
- 新增 `apps/admin/components/role-action-panel.spec.tsx`
  - `viewer` 应显示只读提示并禁用按钮
  - `admin` 应可点击敏感动作按钮

### 首次失败记录

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/auth-viewer-access.e2e-spec.ts`
- 结果：失败
- 原因：缺少 `demo` 受保护路由

- `pnpm --filter @my-resume/admin test`
- 结果：失败
- 原因：
  - 缺少 `postProtectedAction`
  - 缺少 `RoleActionPanel`

## 实际改动

### `apps/server`

- 新增 `AuthDemoController`
  - `GET /auth/demo/viewer-experience`
  - `POST /auth/demo/publish`
  - `POST /auth/demo/ai-analysis`
- 新增 `RequireCapability` 装饰器
- 新增 `RoleCapabilitiesGuard`
- 在角色策略中导出 `RoleCapabilityKey`
- 将敏感动作接口显式切换为 `200 OK`

### `apps/admin`

- 在 `auth-api` 中新增 `postProtectedAction`
- 新增 `RoleActionPanel`
- 在 `AdminDashboardShell` 中接入角色体验区
  - `viewer` 显示只读提示
  - `admin` 可触发演示动作
  - 返回动作反馈消息
- 补充相关样式

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做了：

- 最小角色能力守卫
- 最小受保护 demo 动作
- 最小后台只读体验落地

没有提前进入：

- 真实发布业务
- 真实 AI 任务
- 后台复杂权限矩阵
- 完整管理台功能

### 是否存在可继续抽离的点

- `RoleCapabilitiesGuard` 与 `RequireCapability` 已经沉淀为后续模块可复用基础件
- `RoleActionPanel` 后续可进一步演进为更通用的后台动作面板
- 当前阶段保留 `AuthDemoController` 作为教学型最小验证载体，不再提前拆业务模块

### Review 结论

- 通过
- 进入自测

## 自测结果

### 1. `apps/admin` 单测

- `pnpm --filter @my-resume/admin test`
- 结果：通过

### 2. `apps/server` viewer 边界 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/auth-viewer-access.e2e-spec.ts`
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

### 6. `apps/admin` 类型检查与构建

- `pnpm --filter @my-resume/admin typecheck`
- 结果：通过
- `pnpm --filter @my-resume/admin build`
- 结果：通过
- 备注：依然存在 Tailwind `content` warning，但本轮未引入 Tailwind 方案，不影响当前教学目标

### 7. 真实浏览器联调

- 启动：
  - `pnpm --filter @my-resume/server start`
  - `pnpm --filter @my-resume/admin dev --hostname 127.0.0.1 --port 3000`
- 结果：
  - 使用 `viewer / viewer123456` 登录后，进入 `/dashboard`
  - 只读提示正确显示
  - “发布简历 / 触发 AI 分析” 按钮禁用
  - 使用 `admin / admin123456` 登录后，两个按钮可点击
  - 点击后收到成功反馈消息

## 遇到的问题

### 1. 只定义角色能力还不够

- 风险：如果没有真正落到 guard 和接口，角色语义很容易只停留在“文档层”
- 处理：通过 `RequireCapability + RoleCapabilitiesGuard` 把角色能力绑定到具体接口

### 2. 前端只显示角色字段还不够

- 风险：用户看得到 `viewer`，但不知道它为什么只读
- 处理：显式增加只读提示与禁用按钮，直接把角色语义表达出来

### 3. 组件测试要注意用例之间的 DOM 清理

- 现象：`RoleActionPanel` 两个测试连续渲染时出现重复按钮查询
- 处理：在第二个用例前手动 `cleanup()`

## 可沉淀为教程 / 博客的点

- 为什么“viewer 只读”必须同时落在后端守卫与前端体验上
- 如何把角色能力从静态策略推进到可验证接口
- 教程型项目里如何用 demo 动作验证权限边界，而不提前进入真实业务

## 后续待办

- M2 已完成，可进入 M3 / issue-10：双语内容模型

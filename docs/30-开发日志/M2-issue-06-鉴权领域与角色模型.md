# M2 / issue-06 鉴权领域与角色模型

- Issue：`#11`
- 里程碑：`M2 鉴权与角色：最小登录闭环`
- 分支：`feat/m2-issue-06-auth-domain-model`
- 日期：`2026-03-24`

## 背景

`issue-05` 已创建 `apps/server` 最小 `NestJS` 脚手架。  
在进入真实登录闭环之前，需要先把鉴权领域的最小语义固定下来，避免 `admin / viewer` 的权限边界在后续接口、守卫和前端体验中各自分叉。

## 本次目标

- 定义 `admin / viewer` 角色枚举
- 定义最小用户模型
- 定义当前阶段的角色能力边界
- 为后续 JWT 登录、守卫与 viewer 只读体验提供统一领域基础

## 非目标

- 不实现登录接口
- 不接数据库
- 不生成 JWT
- 不接前端页面

## TDD / 测试设计

- 先新增 `auth-role-policy.spec.ts`
- 先用行为测试描述：
  - `admin` 当前应拥有全部能力
  - `viewer` 当前只能读，不能编辑、发布、触发 AI
  - 角色能力对象需要稳定可枚举
- 先运行测试，确认在领域文件尚未存在前失败
- 再补最小领域实现

## 实际改动

- 新增 `UserRole` 枚举
- 新增最小 `AuthUser` 用户模型
- 新增角色能力策略 `auth-role-policy`
- 新增 `AuthModule` 占位并接入 `AppModule`
- 新增角色领域测试
- 补充 M2-M6 的 issue 拆解细化说明

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只做：

- 角色枚举
- 最小用户模型
- 角色能力边界
- 与领域建模直接相关的测试

没有提前进入：

- 登录接口实现
- 守卫实现
- JWT 实现
- `apps/admin` 开发

### 是否可抽离组件、函数、skills 或其他复用能力

- 当前没有前端组件抽离空间
- `auth-role-policy` 已作为最小可复用领域规则沉淀
- 暂无必要引入新的 skill 或进一步抽象

### Review 结论

- 通过
- 可进入自测

## 自测结果

### 1. TDD 首次失败

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/auth/domain/auth-role-policy.spec.ts`
- 结果：失败
- 原因：缺少 `auth-role-policy` 领域文件

### 2. 角色策略测试

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/auth/domain/auth-role-policy.spec.ts`
- 结果：通过

### 3. `apps/server` 全量单测

- `pnpm --filter @my-resume/server exec jest --runInBand`
- 结果：通过

### 4. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

### 5. 根级验证

- `pnpm run typecheck`
- 结果：通过
- `pnpm run build`
- 结果：通过
- 备注：仍存在 `tailwind.config.cjs` 的 ESM 警告，但与本次任务无关，且构建成功

## 遇到的问题

### 1. 角色能力很容易散落在守卫、控制器和前端判断里

- 风险：如果先写接口再补角色语义，后续 `viewer` 只读边界会到处重复
- 处理：先把能力矩阵收敛为 `auth-role-policy`，后续登录、守卫、前端都复用它

### 2. 当前 issue 同时承接了规划细化

- 现象：本轮还同步补齐了 M3-M6 的 issue 草稿细化
- 处理：保持业务实现只聚焦 `apps/server` 鉴权领域，规划变更只留在研发流程文档中

## 可沉淀为教程 / 博客的点

- 为什么角色模型要先于登录接口落地
- 如何把“viewer 只读、admin 可写”提前沉淀为领域规则
- 如何用最小领域测试固定权限语义

## 后续待办

- 继续 `issue-07`：JWT 登录最小闭环

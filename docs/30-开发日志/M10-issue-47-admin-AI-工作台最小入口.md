# M10 / issue-47 开发日志：admin AI 工作台最小入口

- Issue：#88
- 里程碑：M10 AI 工作台与真实分析：从基础接口到后台闭环
- 分支：`fys-dev/feat-m10-issue-47-ai-workbench-entry`
- 日期：2026-03-27

## 背景

当前仓库已经具备一部分 AI 后端基础：

- `apps/server` 已有 Provider 适配器
- 已有缓存分析报告接口
- 已有文件提取服务
- `admin / viewer` 的角色边界也已经成立

但后台侧还没有一个清晰的 AI 工作台入口。继续把 AI 功能塞在仪表盘动作按钮里，会带来两个问题：

- 教学上很难解释后续 AI 能力要从哪里继续长
- 后续上传、提取、分析与结果阅读会继续散落在控制台首页

所以这一轮的目标，不是接完整 AI 功能，而是先把“AI 工作台入口壳”立起来。

## 本次目标

- 在 `apps/admin` 建立独立的 AI 工作台页面与入口
- 统一展示分析场景、Provider 状态与角色边界说明
- 为后续上传、提取、真实分析和 viewer 体验留出稳定页面结构

## 非目标

- 不接入文件上传与文本提取实现
- 不接入真实分析结果渲染
- 不做复杂多页面后台
- 不改动现有 AI 业务主逻辑

## TDD / 测试设计

### 1. 后台入口与工作台壳测试

新增：

- `apps/admin/components/admin-ai-workbench-shell.spec.tsx`

验证：

- 未登录时仍回到受保护页面提示
- `admin` 能看到 AI 工作台、Provider / model / mode 与分析场景
- `viewer` 能看到只读体验边界说明

同时补充：

- `apps/admin/components/admin-dashboard-shell.spec.tsx`

验证仪表盘首页存在 “进入 AI 工作台” 入口。

### 2. API 客户端测试

新增：

- `apps/admin/lib/ai-workbench-api.spec.ts`

验证：

- 后台会以 Bearer Token 读取新的 AI 运行时摘要接口

### 3. 后端接口回归

补充：

- `apps/server/test/ai-report-role-access.e2e-spec.ts`

验证：

- `viewer / admin` 都可以读取运行时摘要
- `viewer` 仍然不能触发真实分析

### 4. 工程级验证

执行：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server test:e2e -- --runInBand apps/server/test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

## 实际改动

### 1. 新增独立的后台 AI 工作台页面壳

新增：

- `apps/admin/app/dashboard/ai/page.tsx`
- `apps/admin/components/admin-ai-workbench-shell.tsx`

这一页当前只做最小入口壳，集中承接：

- 当前 Provider / model / mode
- 当前支持的分析场景
- 当前账号的角色边界
- 后续 issue 的推进顺序提示

这样后面继续做上传、提取与真实分析时，就不需要继续把 AI 入口塞回控制台首页。

### 2. 在仪表盘首页补清晰入口

更新：

- `apps/admin/components/admin-dashboard-shell.tsx`
- `apps/admin/components/admin-dashboard-shell.spec.tsx`

本轮在后台控制台首页补了一张 `AI 工作台` 入口卡，让读者和使用者在首页就能看出：

- AI 能力已经有独立入口
- 后续 M10 的工作会从这里继续扩展

### 3. 把 AI 工作台 API 从鉴权 API 中拆开

新增：

- `apps/admin/lib/ai-workbench-api.ts`
- `apps/admin/lib/ai-workbench-api.spec.ts`
- `apps/admin/lib/ai-workbench-types.ts`

这是本轮 review 后当场收住的一点：

- `fetchAiWorkbenchRuntime` 不应继续塞进 `auth-api.ts`

原因是后续 `issue-48 / 49` 还会继续新增：

- 上传提取接口
- 真实分析接口
- 结果读取接口

如果这些请求继续往 `auth-api.ts` 堆，会让文件职责越来越混乱。所以这轮提前把 AI 工作台请求层独立出来，为后续 M10 任务留出清晰边界。

### 4. 后端补一个很薄的运行时摘要接口

更新：

- `apps/server/src/modules/ai/ai-report.controller.ts`
- `apps/server/test/ai-report-role-access.e2e-spec.ts`

新增接口：

- `GET /ai/reports/runtime`

这个接口只负责返回：

- 当前 Provider 摘要
- 当前 model
- 当前 mode
- 当前支持的分析场景

它的定位不是新业务中心，而是 AI 工作台的页面级运行时摘要。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只做：

- AI 工作台入口
- 独立页面壳
- 运行时摘要读取
- 仪表盘入口补充

没有越界去做：

- 文件上传
- 文本提取预览
- 真实分析结果渲染
- 队列和任务中心

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

有一处本轮已完成的抽离：

- `apps/admin/lib/ai-workbench-api.ts`

这一步让后续 AI 工作台相关接口不再继续挤进 `auth-api.ts`。

UI 层这轮没有再继续抽共享组件，原因是当前新增的是后台专用页面壳，业务语义还比较强，暂时不适合提前放进 `packages/ui`。

### 本次最重要的边界判断

本次选择“独立 AI 工作台 + 很薄的运行时摘要接口”，而不是：

- 继续把 AI 功能塞在仪表盘首页
- 或者直接开始做上传 / 分析 / 结果全链路

这样做的好处是：

- 教程节奏更清楚
- 后续 issue 边界更稳定
- 页面和接口都为下一步留了自然延伸点

## 自测结果

已执行：

- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/admin build`
- `pnpm --filter @my-resume/server test:e2e -- --runInBand apps/server/test/ai-report-role-access.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

结果：全部通过。

补充说明：

- `admin` 构建产物中已出现 `/dashboard/ai` 路由，说明 AI 工作台入口已经真正进入应用结构，而不是只停留在组件层。

## 遇到的问题

### 1. JSX 中直接写 `->` 会触发解析问题

问题：

在 JSX 文本中直接写 `->`，会让 `>` 被解析为标签边界。

处理：

- 改成 `{'->'}` 的显式文本写法

### 2. AI 工作台请求层最开始放进了 `auth-api.ts`

问题：

虽然一开始这样写更快，但不利于后续 M10 继续扩展。

处理：

- 立即拆成独立的 `ai-workbench-api`
- 保持鉴权请求与 AI 页面请求边界清晰

## 可沉淀为教程/博客的点

- 为什么 AI 能力进入后台前，应该先有独立工作台入口
- 如何用一个很薄的运行时摘要接口支撑页面级说明
- 什么情况下应该及时把新接口从旧 API 文件里拆出来
- 教学型项目里，为什么“先立入口壳”比“先堆功能”更重要

## 后续待办

- 继续推进 `M10 / issue-48`：文件上传与文本提取预览
- 继续推进 `M10 / issue-49`：管理员真实分析闭环
- 继续推进 `M10 / issue-50`：viewer 缓存体验与权限收束

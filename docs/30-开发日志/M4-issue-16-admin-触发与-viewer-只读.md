# M4 / issue-16 admin 触发与 viewer 只读

- Issue：`#24`
- 里程碑：`M4 AI 工具链：Mock 到真实 Provider`
- 分支：`feat/m4-issue-16-admin-trigger-viewer-readonly`
- 日期：`2026-03-25`

## 背景

在 provider 适配器、文件提取入口、缓存分析报告都具备之后，AI 链路还缺最后一个关键边界：角色能力控制。  
如果 `viewer` 也能直接触发分析，那前面“只读体验 + 缓存演示”的设计就失效了；如果 `admin` 没有独立触发入口，后续真实 AI 接入也没有清晰落点。

因此这一轮要把“admin 触发、viewer 只读”的边界真正落到接口层。

## 本次目标

- 让 `viewer` 只能读取缓存 / mock 报告
- 让 `admin` 可以触发分析并写入缓存
- 提供缓存报告列表接口，支撑只读体验
- 补齐角色限制验证

## 非目标

- 不接复杂队列编排
- 不做成本控制策略
- 不接数据库持久化
- 不处理前端后台页面联动

## TDD / 测试设计

### 服务层补充单测

在 `analysis-report-cache.service.spec.ts` 中补充：

- 可暴露预设 demo 报告列表
- 为 `viewer` 只读体验提供稳定数据源

### 角色边界 E2E

新增 `apps/server/test/ai-report-role-access.e2e-spec.ts`，锁定：

- `viewer` 可以读取缓存列表与详情
- `viewer` 无法调用 `POST /ai/reports/cache`
- `viewer` 无法调用 `POST /ai/reports/analyze`
- `admin` 可以调用 `POST /ai/reports/analyze`

## 首次失败记录

### 1. viewer 读取列表接口不存在

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/ai-report-role-access.e2e-spec.ts`
- 结果：失败
- 原因：缺少 `GET /ai/reports/cache`

### 2. admin 触发分析接口不存在

- 同一条 E2E
- 结果：失败
- 原因：缺少 `POST /ai/reports/analyze`

### 3. 缓存服务没有 demo 报告列表能力

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/analysis-report-cache.service.spec.ts`
- 结果：失败
- 原因：缺少 `listReports`

## 实际改动

### `apps/server`

- 扩展 `AnalysisReportCacheService`
  - 支持 `listReports`
  - 支持 demo 报告预置
  - 支持把管理员触发结果写入缓存
- 扩展 `AiReportController`
  - 新增 `GET /ai/reports/cache`
  - 新增 `POST /ai/reports/analyze`
- 对写接口补充角色守卫：
  - `RoleCapabilitiesGuard`
  - `RequireCapability('canTriggerAiAnalysis')`
- 读取接口继续允许 `viewer` 访问：
  - `GET /ai/reports/cache`
  - `GET /ai/reports/cache/:reportId`

### 当前接口边界

- `GET /ai/reports/cache`
  - `admin / viewer` 都可读
- `GET /ai/reports/cache/:reportId`
  - `admin / viewer` 都可读
- `POST /ai/reports/cache`
  - 仅 `admin` 可写
- `POST /ai/reports/analyze`
  - 仅 `admin` 可触发
  - 当前在测试环境下走 `mock provider`

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前已经把角色边界落到了接口层：

- `viewer` 只读缓存与 mock
- `admin` 可触发分析
- AI 写入口受角色能力限制
- demo 报告可直接支撑 viewer 体验

没有提前进入：

- 队列系统
- Redis
- 数据库持久化
- 完整 Prompt 工作流

### 是否存在继续抽离的点

当前保持最小合理拆分：

- `AiReportController` 只承载接口边界
- `AnalysisReportCacheService` 管理缓存读写与 demo 数据
- `AiService` 继续作为统一 provider 入口

后续若分析流程继续变重，可再抽一层 `AiAnalysisApplicationService`。

### Review 结论

- 通过
- 当前 M4 的接口边界已经完整

## 自测结果

### 1. AI 模块单测

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai`
- 结果：通过

### 2. AI 相关 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/ai-file-extraction.e2e-spec.ts test/ai-report-cache.e2e-spec.ts test/ai-report-role-access.e2e-spec.ts`
- 结果：通过

### 3. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

## 遇到的问题

### 1. issue-15 和 issue-16 很容易互相侵入

- 风险：如果在缓存报告阶段就提前把角色守卫一起做完，教程读者会分不清“缓存结构”和“权限边界”的职责
- 处理：先用 issue-15 锁缓存结构，再用 issue-16 单独落角色边界

### 2. viewer 只读体验如果没有预设数据，会变成“什么都看不到”

- 风险：接口虽然限制住了，但体验层没有 demo 数据就无法演示
- 处理：在缓存服务中补预设 demo 报告，让 viewer 登录后可直接读取

## 可沉淀为教程 / 博客的点

- 为什么 AI 项目里“能不能触发”比“能不能看结果”更值得单独建 issue
- 如何在教程型项目里设计 `admin` 与 `viewer` 的 AI 能力边界
- 为什么要给 `viewer` 预置缓存 demo 数据
- mock provider、缓存结果、角色守卫三者如何配合形成完整闭环

## 后续待办

- 关闭 `issue-16`
- 关闭 `M4` 里程碑
- 补一篇 `M4` 教程 / 博客大纲

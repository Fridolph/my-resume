# M4 / issue-15 缓存分析报告

- Issue：`#21`
- 里程碑：`M4 AI 工具链：Mock 到真实 Provider`
- 分支：`feat/m4-issue-15-cached-analysis-reports`
- 日期：`2026-03-25`

## 背景

在 provider 适配器和文件提取入口之后，下一步需要先把“分析结果缓存与读取”这条链路站稳。  
当前我们还不希望过早进入真实模型调用、队列系统和复杂任务编排，因此这一轮只做稳定的 mock 报告缓存。

这样做的意义有两个：

- 后续 `viewer` 角色可以直接读取缓存好的演示结果
- 后续 `admin` 触发真实 AI 时，也能复用相同的报告读取结构

## 本次目标

- 建立稳定的 mock 分析报告结构
- 支持同一输入命中同一份缓存结果
- 提供缓存报告写入 / 读取接口
- 补齐服务层与接口级测试

## 非目标

- 不接真实模型调用
- 不接真实队列系统
- 不做角色权限收紧
- 不做数据库持久化

## TDD / 测试设计

### 服务层单测

新增 `apps/server/src/modules/ai/analysis-report-cache.service.spec.ts`，先锁定：

- 相同输入会复用同一份缓存报告
- 不同分析场景会生成不同的缓存 key
- 可以通过 `reportId` 读取缓存结果

### 接口级 E2E

新增 `apps/server/test/ai-report-cache.e2e-spec.ts`，锁定：

- 登录后可创建 / 复用缓存报告
- 可以通过 `reportId` 读取缓存详情
- 不支持的分析场景会返回 `400`

## 首次失败记录

### 1. 缓存服务不存在

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/analysis-report-cache.service.spec.ts`
- 结果：失败
- 原因：缺少 `AnalysisReportCacheService`

### 2. 缓存报告接口不存在

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/ai-report-cache.e2e-spec.ts`
- 结果：失败
- 原因：缺少 `/ai/reports/cache` 与 `/ai/reports/cache/:reportId`

## 实际改动

### `apps/server`

- 新增 `AnalysisReportCacheService`
- 新增 `AiReportController`
- 在 `AiModule` 中注册缓存报告服务与控制器
- 支持三类 mock 分析场景：
  - `jd-match`
  - `resume-review`
  - `offer-compare`
- 使用“场景 + 语言 + 归一化输入 hash”生成稳定缓存 key
- 返回统一报告结构：
  - `reportId`
  - `cacheKey`
  - `scenario`
  - `locale`
  - `sourceHash`
  - `inputPreview`
  - `summary`
  - `sections`
  - `generator`
  - `createdAt`

### 当前接口

- `POST /ai/reports/cache`
  - 根据输入创建或命中缓存报告
- `GET /ai/reports/cache/:reportId`
  - 读取已缓存报告详情

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。当前只完成了“缓存分析报告”这一层：

- 报告结构稳定
- 同一输入可复用缓存结果
- 已有读取接口
- 已有测试覆盖缓存命中行为

没有提前进入：

- 真实 AI 调用
- Redis / BullMQ
- 权限细分到 `admin` 触发、`viewer` 只读
- 结果持久化到数据库

### 是否存在继续抽离的点

当前先保持最小实现：

- 生成规则集中在 `AnalysisReportCacheService`
- 控制器只负责读写入口
- 后续若接入真实任务流，再把“报告生成器”抽为独立 service / strategy

### Review 结论

- 通过
- 进入自测

## 自测结果

### 1. 服务层专项测试

- `pnpm --filter @my-resume/server exec jest --runInBand src/modules/ai/analysis-report-cache.service.spec.ts`
- 结果：通过

### 2. 缓存报告 E2E

- `pnpm --filter @my-resume/server exec jest --config ./test/jest-e2e.json --runInBand test/ai-report-cache.e2e-spec.ts`
- 结果：通过

### 3. `apps/server` 构建

- `pnpm --filter @my-resume/server build`
- 结果：通过

## 遇到的问题

### 1. 容易把“缓存报告”做成“真实 AI 任务”

- 风险：如果这一步直接引入真实 provider 调用，就会和下一步管理员触发能力耦合在一起
- 处理：当前只生成稳定的 mock 报告，把缓存和读取结构先固定下来

### 2. viewer 只读边界现在还不该塞进这一轮

- 风险：如果现在就把角色控制一起做完，会让 issue-15 和 issue-16 的职责混在一起
- 处理：先保留统一接口，下一轮再收紧为“admin 触发、viewer 只读缓存”

## 可沉淀为教程 / 博客的点

- 为什么在接真实 AI 前，先做“可复用的缓存报告结构”
- 如何用最小 mock 结果把后续接口契约固定下来
- 为什么教程型项目更适合把“缓存”和“实时触发”拆成两个 issue
- 如何用 TDD 锁定“同一输入复用同一份结果”

## 后续待办

- 关闭 `issue-15`
- 继续 `M4 / issue-16`：`admin` 触发实时 AI、`viewer` 只读缓存结果
- 后续再评估 Redis / 队列 / 持久化接入时机

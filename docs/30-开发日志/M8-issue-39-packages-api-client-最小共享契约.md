# M8 / issue-39 开发日志：packages/api-client 最小共享契约

- Issue：#67
- 里程碑：M8 数据持久化与共享契约：从内存态到可持续演进
- 分支：`fys-dev/feat-m8-issue-39-api-client-contract`
- 日期：2026-03-26

## 背景

随着 `issue-38` 完成简历草稿与发布流持久化，`apps/admin` 与 `apps/web` 中原本各自维护的简历类型和基础请求封装，开始变成新的维护风险。

当前最明显的问题是：

- `admin` 和 `web` 都各自维护一份简历领域类型
- 公开读取、草稿读取、草稿更新、发布等接口开始分散在不同 app 内
- 如果继续放着不收口，后续服务层继续演进时，前后端契约漂移会越来越明显

所以这次不追求“一次性做完整 SDK”，而是先抽一个最小、可讲清楚、能落地的共享契约。

## 本次目标

- 建立 `packages/api-client` 的最小共享契约
- 抽离简历主链路的共享类型与核心请求方法
- 让 `apps/admin` 与 `apps/web` 停止重复维护同一份核心类型
- 保持教程节奏，不一次性扩张到全部业务模块

## 非目标

- 不把 `api-client` 做成完整 SDK
- 不重构所有历史请求代码
- 不引入 OpenAPI 类型生成
- 不把 AI、附件等模块一起搬入共享包

## TDD / 测试设计

本次先围绕“最小共享契约是否成立”来设计测试，而不是先追求大而全的抽象。

### 1. 包内最小契约测试

新增：

- `packages/api-client/src/resume.spec.ts`

覆盖：

- 公开简历读取成功 / 404 返回 `null`
- 草稿读取与草稿更新是否正确带上 Bearer Token
- 发布请求与导出链接构造是否符合当前接口约定

### 2. 接入侧回归验证

保留并复用现有测试：

- `apps/admin/lib/resume-draft-api.spec.ts`
- `apps/web/lib/published-resume-api.spec.ts`
- `apps/admin` / `apps/web` 组件测试

这样做可以确认：

- 共享包的抽离没有破坏两个 app 的现有行为
- 教学上也能清楚看到“先抽契约，再让 app 薄接入”的过程

## 实际改动

### 1. 初始化 `packages/api-client`

新增：

- `packages/api-client/package.json`
- `packages/api-client/tsconfig.json`
- `packages/api-client/src/index.ts`
- `packages/api-client/src/resume.ts`
- `packages/api-client/src/resume.spec.ts`

本次没有引入复杂目录结构，只先围绕简历主链路建立一个单文件导出面，保证学习成本低、边界清晰。

### 2. 抽离共享类型与请求方法

在 `packages/api-client/src/resume.ts` 中统一承载：

- `ResumeLocale`
- `LocalizedText`
- `StandardResume`
- `ResumeDraftSnapshot`
- `ResumePublishedSnapshot`
- `fetchPublishedResume`
- `fetchDraftResume`
- `updateDraftResume`
- `publishResume`
- `buildPublishedResumeExportUrl`

这一步的重点不是“封装得多强”，而是先把最容易重复和漂移的部分收口。

### 3. 让 admin / web 切到共享契约

更新：

- `apps/admin/lib/resume.types.ts`
- `apps/web/lib/published-resume.types.ts`
- `apps/admin/lib/resume-draft-api.ts`
- `apps/web/lib/published-resume-api.ts`
- `apps/admin/lib/auth-api.ts`
- `apps/admin/components/export-entry-panel.tsx`
- `apps/web/components/published-resume/published-resume-hero.tsx`

迁移策略：

- 保留 app 内的薄封装文件
- 但让这些文件转为 re-export 或轻量调用共享包

这样做的好处是：

- 现有组件 import 路径几乎不需要大改
- 读者能清晰看到“本地定义 → 薄封装 → 共享包”的渐进迁移过程

### 4. 为 Next.js workspace 依赖补齐配置

更新：

- `apps/admin/package.json`
- `apps/web/package.json`
- `apps/admin/next.config.ts`
- `apps/web/next.config.ts`

本次把 `@my-resume/api-client` 作为 workspace 依赖加入，并通过 `transpilePackages` 明确告诉 Next.js 需要转译该包。

### 5. 把共享包纳入测试主流程

更新：

- `package.json`

将 `@my-resume/api-client` 纳入 `test:unit`，确保它不只是“存在于仓库里”，而是真的进入日常质量门禁。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只完成了：

- 简历主链路的最小共享契约
- 两个 app 的最小接入
- 最基本的测试和文档说明

没有越界到：

- 完整 SDK
- 全量接口迁移
- AI 模块共享化
- OpenAPI 代码生成

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

已抽离：

- 简历领域共享类型
- 简历主链路请求方法
- 已发布导出链接构造函数

当前刻意没有抽更多，是为了避免“为了抽象而抽象”。

### 本次最关键的边界判断

这次没有直接删除 app 内全部请求文件，而是保留薄封装层。

原因是：

- 教程上更容易讲清楚迁移过程
- 改动更小、更稳
- 出问题时也更容易回滚

## 自测结果

已执行：

- `pnpm --filter @my-resume/api-client test`
- `pnpm --filter @my-resume/admin test`
- `pnpm --filter @my-resume/web test`
- `pnpm typecheck:all`
- `pnpm test:ci`
- `pnpm build:all`

结果：全部通过。

## 遇到的问题

### 1. Next.js 默认不会自动处理 workspace 包的源码转译

问题：

`admin` 和 `web` 直接引用 workspace 包源码时，如果不显式配置，后续构建和运行可能出现边界不清晰的问题。

处理：

- 在两个 app 的 `next.config.ts` 中加入 `transpilePackages`

### 2. 共享类型收紧后，旧测试 fixture 暴露出缺失字段

问题：

`web` 侧原本的测试 fixture 没有 `meta` 字段，之前因为类型分散而没有及时暴露出来。

处理：

- 按共享契约补齐 `meta`
- 把关键 fixture 标成明确的 `ResumePublishedSnapshot`

这说明共享契约除了减少重复，还有一个价值：能更早暴露测试样例与真实模型的偏差。

## 可沉淀为教程/博客的点

- Monorepo 里为什么不要一开始就做“全量 SDK”
- 如何从“重复类型”入手抽第一版共享契约
- 为什么“共享包 + app 内薄封装”比“一步删光本地实现”更适合教程型项目

## 后续待办

- 继续推进 `M8 / issue-40`：让 `admin / web` 更系统地切到共享契约并完成冒烟验证
- 逐步评估是否把更多 resume 相关接口继续迁入 `packages/api-client`
- 为后续更完整的 API 契约治理预留空间，但不提前复杂化

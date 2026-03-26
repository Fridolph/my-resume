# M8 / issue-37 开发日志：简历草稿与发布快照表设计

- Issue：#65
- 里程碑：M8 数据持久化与共享契约：从内存态到可持续演进
- 分支：`fys-dev/feat-m8-issue-37-resume-persistence-schema`
- 日期：2026-03-26

## 背景

在 `issue-36` 中，我们已经把 `Drizzle + libsql` 的数据库骨架、环境边界和推表命令立住了，但业务层仍然停留在内存态。

进入 `issue-37` 后，最重要的不是立刻重写服务，而是先把“单份标准简历 + 草稿 / 发布快照”的最小持久化模型设计清楚，为下一步服务持久化改造提供稳定基础。

## 本次目标

- 为标准双语简历设计最小持久化表结构
- 覆盖 `draft / published snapshot` 两种核心状态
- 保持与当前 `StandardResume` 模型边界一致
- 通过测试明确当前方案只服务“单份标准简历”

## 非目标

- 不在本次改造 `ResumePublicationService`
- 不实现 repository 与查询逻辑
- 不引入 JD 定制版、多版本简历、多租户
- 不补复杂审计、回滚或发布审批流

## TDD / 测试设计

本次先围绕“记录语义”和“表结构边界”补最小测试：

### 1. 记录构造测试

新增：

- `apps/server/src/database/resume-records.spec.ts`

覆盖：

- 草稿记录始终绑定到单份标准简历 key
- 发布快照记录使用唯一快照 id
- 两类记录都直接携带当前 `StandardResume` 与 schema version

### 2. schema 结构测试

新增：

- `apps/server/src/database/schema.spec.ts`

覆盖：

- `resume_drafts` 只保留一份标准简历草稿入口
- `resume_publication_snapshots` 采用追加式快照结构
- 当前数据库仍保留 `system_meta` 基础表

这样做的原因是：本次关注的是“模型够不够清晰、边界够不够稳”，不是提前写一整套仓储实现。

## 实际改动

### 1. 新增简历持久化记录构造工具

新增：

- `apps/server/src/database/resume-records.ts`

核心内容：

- `STANDARD_RESUME_KEY`
- `createResumeDraftRecord(...)`
- `createResumePublicationSnapshotRecord(...)`

它的作用是把“单份标准简历”的约束收敛到一处，避免后续 service / repository 在不同地方各自拼 key 和记录结构。

### 2. 在 schema 中加入两张核心业务表

更新：

- `apps/server/src/database/schema.ts`

新增表：

- `resume_drafts`
- `resume_publication_snapshots`

设计说明：

- `resume_drafts`
  - 只保留一份草稿
  - 通过 `resume_key` 主键锁定到 `standard-resume`
- `resume_publication_snapshots`
  - 每次发布生成一条新快照
  - 用 `id` 区分不同发布记录
  - 用 `resume_key + published_at` 索引支持后续读取最新快照

### 3. 使用 JSON 字段直接承载 `StandardResume`

当前使用：

- `resume_json`

直接存储 `StandardResume` 的完整 JSON 结构，而不是现在就把 `profile / education / experiences / projects / skills / highlights` 拆成多张表。

这样做是有意为之：

- v1 只有一份标准简历
- 当前优先保证发布流跑通
- 过早拆太细会把教学重点从“发布流与边界”带偏到“复杂表设计”

### 4. 补充 schema 与记录测试

新增：

- `apps/server/src/database/resume-records.spec.ts`
- `apps/server/src/database/schema.spec.ts`

并在自测中通过 `db:push` 验证 schema 已经能真实落库。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只做了表结构设计与最小记录语义，没有越界到：

- service 持久化实现
- API 响应改造
- 前端共享契约

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

已做的最小抽离：

- `STANDARD_RESUME_KEY`
- `createResumeDraftRecord`
- `createResumePublicationSnapshotRecord`

这部分会在 `issue-38` 中直接复用，避免把持久化逻辑写散。

### 这次最重要的边界判断

虽然 issue 名里包含“发布快照”，但本次并没有设计复杂版本系统。

当前方案的关键判断是：

- 草稿只有一份
- 发布是追加快照
- 快照保留历史，但暂不引入回滚流程

这样既能支撑后续“读取当前发布版本”和“保留发布历史”，也不会在教学阶段过早把模型做重。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/database/schema.spec.ts src/database/resume-records.spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`
- `pnpm --filter @my-resume/server db:push`
- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server test:e2e`

结果：全部通过。

## 遇到的问题

### 1. 发布快照是否要直接做“当前版本”字段

问题：

如果增加 `is_current`，读取当前已发布版本会更直接，但会让当前教学阶段开始碰“状态切换一致性”问题。

处理：

- 暂不增加 `is_current`
- 先通过 `resume_key + published_at` 的追加式快照表达历史
- 在 `issue-38` 中由 repository / service 决定如何读取最新版本

### 2. 模块表是否现在就细拆

问题：

从范式角度看，把简历拆成多张表似乎更“标准”；但当前 v1 只有一份标准双语简历，真正核心是发布流，而不是复杂查询。

处理：

- 当前用 `resume_json` 直接承载完整结构
- 等进入商业版或多版本简历阶段，再讨论更细的拆表策略

## 可沉淀为教程/博客的点

- 教程型项目里，什么时候该用 JSON 存完整内容，什么时候该拆表
- 为什么“草稿一份 + 发布快照追加”是当前阶段最适合讲清楚的模型
- 如何在不过度设计的前提下，为后续发布历史与回滚留钩子

## 后续待办

- 继续推进 `M8 / issue-38`：`ResumePublicationService` 持久化改造
- 让 `issue-38` 直接消费本次 schema 与记录构造工具
- 继续保持 “先模型稳定，再服务替换” 的推进顺序

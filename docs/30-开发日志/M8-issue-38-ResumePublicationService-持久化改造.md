# M8 / issue-38 开发日志：ResumePublicationService 持久化改造

- Issue：#66
- 里程碑：M8 数据持久化与共享契约：从内存态到可持续演进
- 分支：`fys-dev/feat-m8-issue-38-publication-persistence`
- 日期：2026-03-26

## 背景

在 `issue-37` 中，我们已经完成了 `resume_drafts` 与 `resume_publication_snapshots` 两张核心表的设计，但 `ResumePublicationService` 仍然停留在内存态。

这会带来一个明显问题：

- 服务重启后草稿与已发布内容都会丢失
- 当前 API 虽然能跑通，但还不具备真实可持续演进的基础

所以 `issue-38` 的重点，不是重做接口，而是把现有发布流平滑切到数据库持久化实现上。

## 本次目标

- 将 `ResumePublicationService` 从内存实现切换为数据库仓储实现
- 保持现有控制器与 API 语义尽量稳定
- 让草稿、发布态在服务重启后仍然可读取
- 用测试保护“草稿保存 / 发布 / 重启后仍保留”的关键行为

## 非目标

- 不新增新的业务模块
- 不改动前端展示层逻辑
- 不引入多份简历、多租户或 JD 定制版
- 不在本次处理 AI、附件或导出持久化

## TDD / 测试设计

这次测试重点不再是表结构，而是“服务行为是否真的完成了持久化切换”。

### 1. 服务层持久化行为测试

更新：

- `apps/server/src/modules/resume/resume-publication.service.spec.ts`

测试策略：

- 不再只依赖内存对象
- 改为使用真实临时 sqlite 文件
- 在测试中手动建表，避免把关注点放到 CLI 推表流程

覆盖场景：

- 草稿可持续编辑
- 发布会生成稳定快照
- 发布后继续改草稿，不影响已发布内容
- 使用同一数据库文件重新创建 service 后，草稿与发布内容仍然存在

### 2. API 层回归验证

通过现有 e2e 测试确认：

- 控制器异步化后，接口语义没有漂移
- 公开读取与后台读写链路仍然成立

## 实际改动

### 1. 新增发布流仓储层

新增：

- `apps/server/src/modules/resume/resume-publication.repository.ts`

提供的最小能力：

- `findDraft()`
- `saveDraft()`
- `findLatestPublishedSnapshot()`
- `createPublishedSnapshot()`

这样做的目的，是把数据库查询、写入和 service 里的业务编排拆开，保持单一职责，也更方便后续继续补仓储测试。

### 2. 将发布服务改造成数据库驱动

更新：

- `apps/server/src/modules/resume/resume-publication.service.ts`

核心变化：

- `getDraft()` 改为从数据库读草稿
- 首次读取无数据时，自动写入示例简历作为种子草稿
- `getPublished()` 改为读取最新发布快照
- `updateDraft()` 改为保存数据库草稿
- `publish()` 改为基于当前草稿写入发布快照

这里保持了原本的接口语义：

- 仍然区分 `draft` / `published`
- 仍然返回 ISO 时间字符串
- 仍然对外暴露标准简历结构

## 3. 控制器与模块完成异步适配

更新：

- `apps/server/src/modules/resume/resume.controller.ts`
- `apps/server/src/modules/resume/resume.module.ts`

调整内容：

- 控制器方法改为 `async`
- 与发布流相关的读取、保存、发布都显式 `await`
- 在模块中注册 `ResumePublicationRepository`

这一步让控制器无需关心持久化细节，只是顺着 service 的异步语义往下调用。

### 4. 测试切换到真实持久化场景

更新：

- `apps/server/src/modules/resume/resume-publication.service.spec.ts`

本次没有只做 mock 仓储测试，而是直接让 service 面对真实 sqlite 临时文件。

这样做更适合当前阶段教学，因为它能直接回答一个关键问题：

“这次改造后，服务重启数据真的还在吗？”

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本次只完成了发布流服务的持久化替换，没有越界到：

- 更复杂的发布历史管理 UI
- 回滚机制
- 共享 API client
- 前端联动改造

### 是否存在可抽离的组件、公共函数、skills 或其他复用能力

本次新增的可复用抽象主要是：

- `ResumePublicationRepository`

当前先保持它只服务发布流，不额外提前抽成更泛化的 repository 基类，避免教学复杂度上升。

### 这次最关键的边界判断

我们没有为了“更完整”而一次性补：

- 发布历史查询列表
- 当前发布版本标记
- 发布回滚
- 草稿多版本

因为当前 issue 的重点是“把内存态平滑换成持久化实现”，不是把整个内容后台一次做满。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/resume/resume-publication.service.spec.ts`
- `pnpm --filter @my-resume/server test:e2e`
- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/server build`

结果：全部通过。

## 遇到的问题

### 1. Vitest 下 Nest 依赖注入元数据不稳定

问题：

迁移到 `Vitest` 后，不能继续依赖 `emitDecoratorMetadata` 的隐式注入体验。

处理：

- 保持 server 代码中的显式注入写法
- 使用 `@Inject(...)` 明确仓储与数据库依赖

这样可以减少测试环境和运行环境的注入差异。

### 2. 如何验证“持久化”而不是“内存态伪通过”

问题：

如果只 mock repository，虽然测试能过，但无法证明服务重启后数据仍然存在。

处理：

- 使用真实临时 sqlite 文件
- 在同一数据库文件上重建 service 实例
- 直接验证草稿与发布内容是否仍然可读

## 可沉淀为教程/博客的点

- 如何把一个内存态 service 平滑迁移到 repository + database
- 为什么教程型项目里，先做“可持续保存”比先做复杂后台更重要
- 在 `Vitest + NestJS` 组合下，为什么更推荐显式依赖注入

## 后续待办

- 提交并合并 `issue-38`
- 继续推进 `M8` 后续共享契约相关 issue
- 逐步把“仅能跑”的内存态模块替换成“可持续演进”的基础设施能力

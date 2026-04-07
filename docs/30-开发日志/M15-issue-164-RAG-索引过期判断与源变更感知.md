# M15 / issue-164 开发日志：RAG 索引过期判断与源变更感知

- Issue：`#164`
- 里程碑：`M15 AI / RAG 能力深化`
- 分支：`fys-dev/feat-m15-issue-161-163-ai-rag-tightening`
- 日期：`2026-04-07`

## 背景

在 `issue-161 ~ 163` 完成后，当前 `my-resume` 的 RAG 基线已经具备：

- 结构化简历知识源
- 博客知识目录切片
- `status / rebuild / search / ask` 最小 API 闭环
- provider 与索引摘要信息

但还有一个关键缺口没有补上：

当简历源文件或博客知识目录发生变化时，当前系统还不能直接判断“已有索引是否已经过期”。

这会带来几个实际问题：

1. 调用方不知道当前索引是不是基于最新源内容构建的
2. 教学演示时很难说明“为什么这次要重建索引”
3. 后续如果做人机协作或 Agent 接棒，状态锚点还不够稳定

所以 `#164` 的目标不是做“自动重建”，而是先把“能不能判断已经 stale”这件事做清楚。

## 本次目标

- 为当前 RAG 索引补充源内容哈希信息
- 让 `status` 接口能明确返回 `stale`
- 同时区分：
  - 当前简历源 hash
  - 当前博客知识目录 hash
  - 索引构建时记录的 hash
- 当源变更后，可以直接从状态接口判断是否需要重建索引

## 非目标

- 不做自动重建
- 不做异步任务或定时调度
- 不做 admin 可视化管理页
- 不引入数据库或外部缓存
- 不改变现有 `search / ask` 主流程

## TDD / 测试设计

这轮测试重点不是“检索结果变没变”，而是“索引状态能不能正确感知源变化”。

### 1. service 层单测

更新：

- `apps/server/src/modules/ai/rag/__tests__/rag.service.spec.ts`

覆盖：

- 刚完成 `rebuildIndex()` 后，`stale` 应为 `false`
- 修改简历源文件后，`stale` 应变为 `true`
- 修改博客知识目录内容后，`stale` 应变为 `true`

### 2. e2e 验证

更新：

- `apps/server/test/ai-rag.e2e-spec.ts`

覆盖：

- 调用 `/ai/rag/index/rebuild` 后，`/ai/rag/status` 返回 `stale === false`
- 修改 `RAG_RESUME_SOURCE_PATH` 指向的源文件后，再次查询 `status`
- 返回值里应能看到：
  - `stale === true`
  - `currentSourceHash` 与 `indexedSourceHash` 不一致

这样可以同时锁住：

- 核心服务逻辑
- 对外 API 行为

## 实际改动

## 1. 为索引文件补充 source / knowledge hash 元数据

更新：

- `apps/server/src/modules/ai/rag/rag.types.ts`

在 `RagIndexFile` 中补充：

- `blogDirectoryPath`
- `sourceHash`
- `knowledgeHash`

这样索引文件不再只记录“切了多少块、什么时候生成”，还会记录：

- 当时对应的简历源内容指纹
- 当时对应的博客知识目录内容指纹

这一步是后续 stale 判断成立的前提。

## 2. 在 `rebuildIndex()` 阶段写入当前源内容哈希

更新：

- `apps/server/src/modules/ai/rag/rag.service.ts`

新增：

- `computeContentHash()`
- `computeKnowledgeDirectoryHash()`

并在索引重建时，把当前：

- `resume source`
- `knowledge directory`

对应的 hash 一起写入索引文件。

这里选择 hash 方案，而不是简单比较时间戳，原因是：

- 内容级判断更直观
- 更适合教学说明
- 不依赖文件修改时间是否稳定
- 对后续多知识源扩展也更容易复用

## 3. 在 `status` 中返回 stale 与 hash 对照信息

更新：

- `apps/server/src/modules/ai/rag/rag.service.ts`

`getStatus()` 现在除了已有的 provider 与 chunk 摘要外，还会额外返回：

- `stale`
- `currentSourceHash`
- `currentKnowledgeHash`
- `indexedSourceHash`
- `indexedKnowledgeHash`

这样调用方不只知道“现在过期没”，还知道：

- 是当前源和索引不一致
- 还是知识目录和索引不一致
- 当前状态和上次构建状态分别是什么

这正好符合我们在 Dao / Agent 方向里强调的那种“状态可接”：

- 现在做到哪
- 为什么判断要重建
- 下一步该做什么

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。

本轮只补了：

- 索引过期判断
- 源变更感知
- `status` 的 stale 可见性

没有扩张到：

- 自动重建
- UI 工作台
- 新的 RAG 检索策略
- 新的存储基础设施

### 为什么先做 stale 判断，而不是直接自动重建

因为当前仓库仍处于教程型渐进重构阶段。

如果直接一步做到自动重建，会把多个问题混在一起：

- 什么时候触发
- 谁来触发
- 重建失败怎么办
- 并发请求怎么办

而当前更适合先把“判断依据”做清楚，再决定“动作自动化”。

### 是否存在后续可抽离的公共能力

有。

后续可以继续往下拆：

1. 通用文件 / 目录 hash 工具
2. RAG source manifest / index manifest 约定
3. stale → rebuild 的显式工作流封装

但当前先停在 issue 边界内更合适。

## 自测结果

已执行：

- `pnpm --filter @my-resume/server test -- src/modules/ai/rag/__tests__/rag.service.spec.ts`
- `pnpm --filter @my-resume/server test:e2e -- test/ai-rag.e2e-spec.ts`
- `pnpm --filter @my-resume/server typecheck`

结果：

- 单测通过
- RAG e2e 通过
- server 类型检查通过

## 遇到的问题

这轮真正的难点不是 hash 算法本身，而是边界判断：

1. 简历主源与博客知识目录要分开比较
2. `status` 需要同时返回“当前值”和“索引值”，否则 stale 只有布尔结果，不够可解释
3. 这轮不能顺手做自动重建，否则会越出当前 issue 范围

换句话说，问题不在“能不能做”，而在“做到哪一层刚好合适”。

## 后续可写成教程 / 博客的切入点

- 为什么 RAG 不只要能检索，还要能判断“索引是否过期”
- 内容 hash 与时间戳判断在教学项目中的取舍
- 从 `status 可见` 到 `状态可接`：AI / RAG 接口如何服务后续 Agent 化协作
- 为什么教程型项目要先做 stale 判断，再做自动重建

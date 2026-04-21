# M21 / issue-177 开发日志：RAG 数据契约与索引表设计（resume_core 优先）

- Issue：`#177`
- 里程碑：`M21 RAG 可解释问答最小闭环`
- 分支：`fys-dev/feat-m21-issue-177-rag-contract-index-schema`
- 日期：`2026-04-21`

## 背景

当前仓库的核心业务数据以 `resume_drafts` JSON 结构为中心，适合编辑与展示，但不适合直接做 RAG 检索。  
如果直接在大段 JSON 上做检索，容易出现“命中关键词但上下文噪声较大”的问题，影响个人简历助手回答稳定性。

## 本次目标

- 设计并落地 RAG 检索态最小数据骨架（文档层 / chunk 层 / 运行状态层）。
- 固定 `sourceType/sourceScope/sourceVersion` 语义，避免后续迭代时字段漂移。
- 保持与现有业务表解耦，不破坏当前简历编辑与发布链路。

## 非目标

- 不在本轮引入重型向量数据库。
- 不在本轮改写现有 `RagService` 检索主流程。
- 不在本轮实现完整同步编排（留给后续 issue）。

## TDD / 测试设计

- 先补 `schema.spec.ts`，验证新增三张表字段是否符合契约设计。
- 补 `rag.types.spec.ts`，验证旧 `sourceType` 到新契约类型映射是否稳定。
- 暂不进入端到端检索测试（本轮以契约收口为主）。

## 实际改动

- `apps/server/src/database/schema.ts`
  - 新增 `RagSourceType/RagSourceScope/RagIndexRunStatus` 类型定义。
  - 新增 `rag_documents`（检索文档主表）。
  - 新增 `rag_chunks`（检索 chunk 表，embedding 先落 JSON）。
  - 新增 `rag_index_runs`（索引运行状态表）。
  - 为唯一键、过滤维度和状态查询补齐索引。
- `apps/server/src/database/__tests__/schema.spec.ts`
  - 补齐三张 RAG 表的字段断言。
- `apps/server/src/modules/ai/rag/rag.types.ts`
  - 增加检索态类型与旧类型映射函数 `mapLegacySourceTypeToRetrievalSourceType`。
- `apps/server/src/modules/ai/rag/__tests__/rag.types.spec.ts`
  - 增加映射函数测试。
- `apps/server/src/modules/ai/rag/rag-retrieval.repository.ts`
  - 新增检索态仓储骨架：
    - 文档 upsert
    - chunk 覆盖写入
    - 索引运行记录写入与查询
- `apps/server/src/modules/ai/ai.module.ts`
  - 注册 `RagRetrievalRepository` provider。
- `docs/20-研发流程/01-GitHub-标准开发流程.md`
  - 增加“AI 功能开发（边做边学）补充流程”。

## Review 记录

### 是否符合当前 Issue 与里程碑目标

符合。  
本轮仅收口数据契约与最小骨架，没有提前扩展到复杂检索编排与会话层。

### 是否可抽离复用能力

可复用能力已沉淀为 `RagRetrievalRepository`，后续 `#178/#179` 可直接复用。

## 自测结果

- 类型检查：受当前执行环境限制，未执行（本机缺少 `pnpm/npm` 命令链）。
- 测试：受当前执行环境限制，未执行（同上）。
- 构建：受当前执行环境限制，未执行（同上）。
- 手工验证：已完成 schema 与仓储逻辑静态审查。

> 待你本地执行：
> - `pnpm --filter @my-resume/server test -- src/database/__tests__/schema.spec.ts src/modules/ai/rag/__tests__/rag.types.spec.ts`
> - `pnpm --filter @my-resume/server typecheck`

## 遇到的问题

- 环境中缺少 `pnpm/npm`，无法在当前会话直接执行测试与 typecheck。
- 旧 `sourceType` 与新契约 `sourceType` 存在并行期，已通过映射函数显式收口。

## 可沉淀为教程/博客的点

- 为什么“业务表模型”和“检索表模型”应分层设计。
- 为什么第一版可以先用 SQLite JSON 存 embedding，而不急于上向量数据库。
- `sourceType/sourceScope/sourceVersion` 如何帮助降低 RAG 回答噪声。

## 后续待办

- 进入 `#178`：打通 `draft/published` 到 `rag_documents/rag_chunks` 的同步链路。
- 在 `#178` 中增加“同步失败可重试”的运行状态收敛。
- 在 `#180` 中把拒答策略与 citations 强制要求落到 API 层。


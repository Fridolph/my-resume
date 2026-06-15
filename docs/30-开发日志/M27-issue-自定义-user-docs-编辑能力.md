# M27 / issue-自定义 user_docs 编辑能力

- 里程碑：M27 多域 RAG 路由修正与补充知识库检索收口
- 子任务：M27.3 / 已入库资料编辑能力（仅自定义资料）
- 分支：`fys-dev/fix-m26-ai-chat-daily-turn-reset`
- 日期：2026-06-12

## 背景

当前 Admin 的 RAG 已入库管理已经能完成：

- 自定义资料新增
- 文件资料上传
- 列表查看
- 删除与 user_docs 向量同步

但“录错类型、正文需要修正、链接要调整”这类真实维护动作还没有闭环。

尤其是自定义资料，本来就是管理端手动补充进去的内容，如果只能删掉重建，体验和数据追踪都会比较差。

因此这一轮只收口一件事：

- 让 **自定义 user_docs** 支持查看详情与原地编辑

同时明确边界：

- 上传文件资料继续只读，不支持在线编辑正文
- 不新增数据库表
- 不改公开 Chat API 契约

## 本次目标

- 为 Admin 补齐“仅自定义资料可编辑”的最小闭环
- 服务端提供详情读取与真实更新链路
- 更新后保留同一个 `documentId`
- 更新后同步重建 chunks / embeddings / vector store
- 管理端列表与详情能立即看到更新结果

## 非目标

- 不支持上传文件资料在线编辑
- 不新增富文本编辑器
- 不改 Admin 表单结构与内容类型体系
- 不处理 RAG 路由或回答策略

## 设计判断

### 1. 如何识别“可编辑的自定义资料”

新写入的 custom 资料在 `metadataJson` 中显式记录：

- `ingestMode: 'custom'`
- `rawContent`
- `rawLinkUrl`

历史资料为了兼容旧数据，不强制迁移，而是保留兼容判断：

- 如果 `metadataJson.richCard` 存在，也视为可编辑 custom

这样能在不改表结构的前提下，兼容历史数据与新数据。

### 2. 为什么要存 `rawContent`

原先如果只靠 `rag_chunks` 回拼正文，切片 overlap 会导致编辑框内容出现重复噪音。

所以这轮把自定义资料的原始正文直接存进 metadata：

- 查看详情优先读 `rawContent`
- 只有历史数据没有 `rawContent` 时，才降级用 chunks 拼接

这比只靠 chunk 回拼稳定很多，也更适合后续继续扩展编辑能力。

### 3. 为什么不更换 documentId

本轮更新不是 delete + recreate，而是原地更新：

- `documentId` 保持不变
- 更新 `sourceVersion`
- 覆盖 `rag_documents`
- 重建 `rag_chunks`
- 同步删除并重写向量数据

这样列表、引用追踪、后续 diagnostics 都不会因为编辑而断链。

## 实际改动

### Server

更新：

- `apps/server/src/modules/ai/rag/user-docs-ingestion.service.ts`
- `apps/server/src/modules/ai/rag/rag.controller.ts`
- `apps/server/src/modules/ai/rag/rag-retrieval.repository.ts`
- `apps/server/src/modules/ai/rag/dto/rag-swagger.dto.ts`

新增能力：

- `GET /api/ai/rag/documents/:documentId`
- 真实 `PUT /api/ai/rag/custom/:documentId`

关键实现：

- 自定义资料写入 metadata 时补充 `ingestMode / rawContent / rawLinkUrl`
- `listDocuments()` 返回 `editable`
- `getDocumentDetail()` 返回完整正文、链接和可编辑状态
- `updateCustom()` 拒绝非 custom 资料，允许 custom 资料原地更新
- 更新后执行：
  - 重算 content hash
  - 重切 chunks
  - 重 embedding
  - 覆盖 DB chunks
  - `delete + upsert` 向量数据

### API Client

更新：

- `packages/api-client/src/types/ai.types.ts`
- `packages/api-client/src/ai.ts`

新增：

- `RagDocument`
- `RagDocumentDetail`
- `FetchRagDocumentDetailInput`
- `UpdateRagCustomDocumentInput`
- `UpdateRagCustomDocumentResult`
- `createFetchRagDocumentDetailMethod`
- `createUpdateRagCustomDocumentMethod`

### Admin

更新：

- `apps/admin/app/[locale]/dashboard/ai/_ai/rag-manage-shell.tsx`
- `apps/admin/app/[locale]/dashboard/ai/_ai/services/ai-file-api.ts`

实现结果：

- 已入库列表中仅 `editable=true` 的资料显示“编辑资料”入口
- 详情弹窗升级为“查看 / 编辑”双态
- 可编辑字段：
  - 标题
  - 类型
  - 正文
  - 链接
- 保存时直接提交，不再弹二次确认
- 保存成功后：
  - 刷新列表
  - 刷新当前详情
  - 退出编辑态

## Review 记录

### 是否符合当前任务边界

符合。

本轮只动了：

- RAG user_docs 服务端详情/更新链路
- API Client 类型与方法
- Admin RAG 管理页查看/编辑弹窗
- 对应测试

没有扩到：

- 文件资料编辑
- Chat 路由
- 数据库表结构
- 新依赖引入

### 风险与处理

#### 1. 历史 custom 资料没有 `rawContent`

处理方式：

- 优先读 metadata 中的 `rawContent`
- 不存在时才退回 chunks 拼接
- 若正文尾部存在历史拼接的 `链接：xxx`，详情层会去尾还原

#### 2. Admin 现有页面没有统一详情接口封装

处理方式：

- 先复用当前页面内的 `fetch` 风格
- 不强行大范围重构到新请求模式
- 先把功能跑通和测试补齐

#### 3. HeroUI 输入组件的 API 与常见实现不同

处理方式：

- 沿用项目现有 `label + Input/TextArea` 包裹写法
- 不引入额外表单抽象

## 测试与验证

已通过：

- `pnpm --filter @my-resume/server exec vitest run --config ./vitest.config.mts src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts src/modules/ai/rag/__tests__/rag.controller.spec.ts --pool forks --poolOptions.forks.singleFork`
- `pnpm --dir apps/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/ai-file-api.spec.ts'`
- `pnpm --dir apps/admin exec vitest run 'app/[locale]/dashboard/ai/_ai/__tests__/rag-manage-shell.spec.tsx'`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/api-client build`
- `pnpm check:tsx-types`
- `git diff --check`

## 后续可继续演进

- 为上传文件资料补“替换文件重建”能力，而不是在线编辑正文
- 在 Admin 详情中增加内容来源提示，让“自定义 / 上传”边界更直观
- 后续如果需要更精细控制 card 展示，可继续补 rich card metadata 的编辑入口

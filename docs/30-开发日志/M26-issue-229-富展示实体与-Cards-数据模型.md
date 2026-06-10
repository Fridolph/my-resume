# M26 / #229 富展示实体与 Cards 数据模型

## 背景

#227 和 #228 已经把 AI Chat 回答生成收束到 graph 编排，并让所有问题都以 `resume_core` 为基础上下文，再按问题路由到项目、兴趣、创作等知识域。下一步需要解决的是：检索 chunk 适合召回，却不适合直接承载前端 Card 展示字段。如果前端只用长 snippet 伪造成 HobbyCard / ArticleCard / ProjectCard，展示会很薄，也不利于后续 AGUI 化。

## 本次目标

- 定义并贯通 rich card metadata 模型。
- 让 RAG chunk / citation 可以携带富展示字段。
- 让 `AiChatGraphService` 将 user_docs 的 rich metadata 映射为 `hobby_card / article_card / media_card / project_card`。
- 让 Web renderer 渲染可选图片、链接、发布时间和媒体预览。
- 缺少 rich metadata 时继续降级为现有 snippet / tags / citation 展示。

## 非目标

- 不新增数据库表。
- 不做通用 CMS。
- 不做图片上传中心。
- 不要求历史 chunk 全部补齐富展示实体。
- 不改变 SSE 事件协议和 Chat 会话状态机。

## 实际改动

- `apps/server/src/modules/ai/rag/rag.types.ts`
  - 新增 `RagRichCardMetadata` 与 `RagRichCardMedia`。
  - `RagChunk`、`RagSearchMatch`、`RagAskCitation` 支持可选 `richCard`。
- `apps/server/src/modules/ai/rag/rag.service.ts`
  - 新增 richCard metadata 归一化 helper。
  - SQLite chunk、document metadata 与 vector metadata 均可提取 `richCard`。
  - `buildRagAskCitations()` 将 `richCard` 透传给 Chat。
- `apps/server/src/modules/ai/rag/user-docs-ingestion.service.ts`
  - `ingestCustom()` 为手动录入资料写入默认 richCard：标题、描述、链接与关键词。
  - 保持原有正文拼接和 chunking 策略不变。
- `apps/server/src/modules/ai/chat/ai-chat-graph.service.ts`
  - user_docs 的 article / media / hobby / project block 优先使用 `citation.richCard`。
  - 缺失时继续回退到 `citation.title / snippet / sourcePath / tags`。
- `apps/server/src/modules/ai/chat/ai-chat.types.ts` 与 `packages/api-client/src/types/ai.types.ts`
  - 扩展 article / hobby / media / project card 可选展示字段。
  - API client 包入口同步导出新增类型。
- `apps/web/app/_shared/ai-chat/ai-chat-answer-block-renderer.tsx`
  - Project / Hobby / Article / Media Card 支持图片。
  - Hobby / Article 支持媒体预览列表。
  - Article 支持 `publishedAt`。
  - Project 支持外链入口。

## Review 记录

- 改动集中在 #229 约定的 server chat block builder、api-client block types、web card renderer 与 tests。
- 没有新增数据库表、环境变量、依赖或上传能力。
- 新字段全部可选，兼容历史消息与旧 chunk。
- Web 媒体预览中的类型徽标设置为 `aria-hidden`，避免干扰链接可访问名称。
- 当前 `ingestCustom()` 仍不额外接入向量同步，保持本轮范围不扩张；已有 file ingestion 的 vector metadata 链路不受影响。

## 测试与验证

- `pnpm --filter @my-resume/server test -- src/modules/ai/chat/__tests__/ai-chat-graph.service.spec.ts src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts src/modules/ai/rag/__tests__/rag.service.spec.ts`
  - 结果：通过。当前 server 配置实际跑过 61 个测试文件，共 258 个测试。
- `pnpm --filter @my-resume/api-client test -- src/ai.spec.ts`
  - 结果：通过。当前 api-client 配置实际跑过 3 个测试文件，共 32 个测试。
- `pnpm --dir apps/web exec vitest run 'app/_shared/ai-chat/__tests__/ai-chat-answer-block-renderer.spec.tsx'`
  - 结果：通过。3 个测试通过。
- `pnpm --filter @my-resume/server typecheck`
  - 结果：通过。
- `pnpm --filter @my-resume/api-client build && pnpm --filter @my-resume/api-client typecheck`
  - 结果：通过。
- `pnpm --filter @my-resume/web typecheck`
  - 结果：通过。
- `pnpm check:tsx-types`
  - 结果：通过。
- `git diff --check`
  - 结果：通过。

## 后续衔接

- #230 可以继续补 RAG / Graph 的可观测日志与固定评测样例，观察 richCard 命中率和降级情况。
- 后续若需要更强 AGUI，可在不改基础 citation 协议的前提下，为 richCard 增加更具体的展示字段。
- 如果未来需要图片上传或富媒体管理，应单独开通用上传中心或轻量 CMS issue，不混入当前 metadata 契约。

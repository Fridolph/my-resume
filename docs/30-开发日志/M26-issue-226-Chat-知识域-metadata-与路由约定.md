# M26 / issue #226：Chat 知识域 metadata 与路由约定

## 背景

M25 已完成 AI Intro 独立页面、预设问答与 AGUI 风格 Answer Block Renderer。进入 M26 后，需要先给 RAG 知识内容建立稳定的逻辑分域契约，为后续 LangGraph 路由、项目卡片 / 兴趣卡片 / 文章卡片等多样化展示打基础。

本 issue 的重点不是马上拆物理表或引入 LangGraph，而是在现有 RAG 数据链路中补齐 `knowledgeDomain / contentType / sourceCollection / renderHint`，让旧简历索引、博客知识、用户上传资料和向量检索返回都能被统一解释。

## 本次目标

- 新增 RAG 知识域 metadata 模型与归一化 helper。
- 在本地索引、用户资料入库、SQLite 检索、向量检索和 API 返回中透传知识域信息。
- 支持 `/ai/rag/search`、`/ai/rag/ask` 请求级 `knowledgeDomains` 路由过滤。
- API Client 同步 `knowledgeDomains / knowledgeDomain / renderHint` 类型与请求参数。
- 补充核心测试，证明逻辑分域在本地检索与向量检索中都生效。

## 非目标

- 不新增数据库表或字段，不做 schema migration。
- 不拆 Milvus collection，不做历史向量库强制重建。
- 不改 embedding provider、环境变量、Docker 或部署脚本。
- 不实现 LangGraph 多节点路由；该能力留给后续 issue。
- 不调整 Web Chat / AI Intro 的展示交互。

## 实际改动

- 新增 `rag-knowledge-domain.ts`，集中管理：
  - `resume_core / projects / experience / skills / hobbies / writing_media` 知识域。
  - `profile / project / experience / skills / education / strength / article / hobby / media / general` 内容类型。
  - `text / project_card / experience_card / hobby_card / article_card / media_card` 渲染建议。
  - metadata 归一化、旧 chunk 推断、domain 过滤等 helper。
- 本地简历切块和博客知识切块统一补齐 metadata。
- 用户资料导入时把实际生效的 knowledge metadata 写入 document / chunk / vector metadataJson。
- `RagService` 支持请求级 `knowledgeDomains`：
  - 自动保留 `resume_core` 作为基础兜底域。
  - 本地文件索引、SQLite chunks、向量结果统一按逻辑域过滤。
  - 向量搜索将 `knowledgeDomains` 传入 vector store，并在服务层再做一次 post-filter，避免当前 Milvus schema 不变时漏筛。
- `buildLocalRagSearchContext` 保留 chunk metadata，修复本地检索打分后 metadata 丢失的问题。
- Swagger DTO 与 API Client 同步新增 `knowledgeDomains / knowledgeDomain / renderHint` 契约。
- Mock Milvus adapter 增加 knowledge domain 过滤，方便本地测试和教学演示。

## Review 记录

- 本轮严格保持“逻辑分域”而非“物理拆表”：全部通过既有 metadataJson 和旧 chunk 推断完成，避免破坏已有入库数据。
- 对旧数据采用 fallback 推断：没有显式 metadata 时，根据 `sourceType / section / title / contentType` 推导 domain 和 render hint。
- `knowledgeDomains` 请求参数会通过校验；非法域值由 controller 返回可读错误，不静默忽略。
- 本地检索最初发现 metadata 在 `buildLocalRagSearchContext` 中被丢弃，已补测试并修复。
- `resume_core` 自动加入 domain 过滤，是为了保证基础简历事实不被兴趣、文章等增强域完全隔离掉。
- 没有引入新依赖，没有修改 lockfile，没有触碰敏感环境文件。

## 测试与验证

- `pnpm --filter @my-resume/server test -- src/modules/ai/rag/__tests__/rag.service.spec.ts src/modules/ai/rag/__tests__/rag-search-context-builder.spec.ts src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts`
- `pnpm --filter @my-resume/server test -- src/modules/ai/rag/__tests__/user-docs-ingestion.service.spec.ts src/modules/ai/rag/__tests__/rag.service.spec.ts`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/api-client test -- src/ai.spec.ts`
- `pnpm --filter @my-resume/api-client typecheck`

> 备注：本地 API Client 的 `vitest` pnpm symlink 曾指向不完整 store 目录，已通过 `pnpm install --offline --frozen-lockfile` 重新补齐 workspace 链接；lockfile 未变化。

## 遗留风险与后续

- 当前只是逻辑分域过滤，真实线上 Milvus 仍未按 domain 建索引字段；服务层 post-filter 可以保证正确性，但大规模数据下召回效率需要后续评估。
- 旧数据的 domain 推断依赖 section/title/contentType，若历史资料 metadata 过少，仍可能被归到 `general / writing_media`。
- #227 可在此基础上接 LangGraph 路由：先分类问题域，再按 domain 查询对应知识集合，最后组合 answer blocks。
- 后续如果决定物理拆 collection 或新增 metadata 索引字段，需要单独 issue 处理迁移、重建和回滚方案。

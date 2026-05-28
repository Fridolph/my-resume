# M21 里程碑收束：RAG 可解释问答最小闭环

## 一、里程碑目标回顾

M21 的核心目标是在 `my-resume` 中建立最小 RAG 知识库链路：
- 支持 user_docs 入库（上传文档 → chunk → embedding → SQLite + Milvus）
- 支持多源检索（resume_core + knowledge + user_docs）
- 支持 RAG 问答（search → context assembly → LLM answer）
- 本地模式（ECS）无需向量数据库即可完成全部检索

## 二、已完成 Issue

| Issue | 内容 | 状态 |
|---|---|---|
| #177 | RAG 数据契约与索引表设计 | ✅ |
| #178 | 简历版本同步链路 | ✅ |
| #179 | user-docs 入库契约与最小接口闭环 | ✅ |
| #209 | auth users 表与密码哈希鉴权 | ✅ |

## 三、关键设计决策

1. **双存储模型**：SQLite（权威数据源）+ 向量存储（Milvus/local，最佳努力同步）
2. **检索路由**：优先向量存储 → 失败回退本地 SQLite 内存余弦相似度
3. **ECS 兼容**：不设 `RAG_SEARCH_USE_VECTOR_STORE` 默认走本地模式
4. **重排管线**：5 层管道（策略检测 → section加权 → 噪音诊断 → 去噪 → 证据分层）
5. **配置驱动**：重排策略通过 `config/rag-search-rerank.config.ts` 外置

## 四、已沉淀文档

| 文档 | 路径 |
|---|---|
| 开发日志 #177 | `docs/30-开发日志/M21-issue-177-RAG-数据契约与索引表设计.md` |
| 开发日志 #178 | `docs/30-开发日志/M21-issue-178-简历版本同步链路.md` |
| 开发日志 #179 | `docs/30-开发日志/M21-issue-179-user-docs-入库契约与最小接口闭环.md` |
| 开发日志 #209 | `docs/30-开发日志/M21-issue-209-auth-users-表与密码哈希鉴权.md` |
| AI/RAG 学习引导 | `docs/10-架构设计/06-my-resume-AI-RAG-学习引导与真实链路说明.md` |
| RAG 管线拆解 | `docs/60-源码拆解/08-RAG-检索与问答-管线与重排拆解.md` |
| 检索评测器 | `apps/server/src/modules/ai/rag/user-doc-retrieval-evaluator.ts` |

## 五、进入 M22 的前置条件

- [x] RAG 最小 ask/search/rebuild 闭环可跑通
- [x] 三源检索（resume_core + knowledge + user_docs）已打通
- [x] 本地模式（ECS）无需 Milvus
- [x] 重排管线可用
- [ ] 语义分块策略优化 → 进入 M24 承接

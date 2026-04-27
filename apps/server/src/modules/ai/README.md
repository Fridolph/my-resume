# ai module

## 模块职责

- 提供 AI 分析、简历优化、RAG 检索与同步相关能力
- 管理 AI provider 适配、调用记录与缓存策略

## 当前分层

- `domain/ports/`：AI provider 端口契约
- `application/services/`：AI 用例与业务编排服务
- `infrastructure/config/`：运行时配置解析
- `infrastructure/providers/`：模型供应商适配
- `infrastructure/repositories/`：AI 记录仓储
- `transport/controllers/`：AI HTTP 控制器
- `transport/dto/`：Swagger / 请求响应 DTO
- `rag/`：RAG 子域（本轮保持原目录，后续按 Issue 渐进细化）

## 迁移说明

- 本轮采用“兼容导出”策略：模块根目录保留旧路径 `re-export`
- 新增与修改代码优先落到分层目录
- 后续可在独立 Issue 中逐步移除兼容层

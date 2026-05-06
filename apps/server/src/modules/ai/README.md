# ai module

## 模块职责

- 提供 AI 分析、简历优化、RAG 检索与同步相关能力
- 管理 AI provider 适配、调用记录与缓存策略

## 当前分层

- `domain/ports/`：AI provider 端口契约
- `application/services/`：AI 用例与业务编排服务
- `application/prompts/`：跨子域 AI Prompt builder，业务层只传结构化输入，不直接拼接大段 Prompt
- `application/resume-import/`：AI 简历导入识别子域，集中管理类型、常量、Prompt 与纯函数规则
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

## Prompt 管理约定

- 业务服务 / Controller 不直接写大段 `systemPrompt` 或 `prompt` 文案。
- 新增 Prompt 时优先建立 `*.prompt.ts`，导出 `buildXxxPrompt` / `buildXxxSystemPrompt` 或短常量。
- 双语 Prompt 优先在同一个文件内按 `locale` 分支管理；没有英文版的 Prompt 可以保持单语。
- Prompt builder 只负责模板、结构和语言差异，不直接调用 provider、不读取数据库、不写业务状态。
- 每个重要 Prompt builder 需要补最小单测，断言核心约束和关键输入存在，避免硬编码完整长文本。
- 业务专属 Prompt 就近放在子域，例如 `application/resume-import/prompts/`；跨子域或通用 Prompt 放在 `application/prompts/`。

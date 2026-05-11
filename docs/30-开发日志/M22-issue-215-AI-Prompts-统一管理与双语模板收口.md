# M22 / Issue 215 - AI Prompts 统一管理与双语模板收口

- Issue：`#215`
- 里程碑：`M22 AI 体验与工程治理`
- 分支：`fys-dev/feat-m22-issue-215-ai-prompts-management`
- 日期：`2026-05-06`

## 背景

在检查 `RagService.ask` 时发现业务逻辑里直接内联了中英文 prompt。继续排查后确认类似写法还存在于 AI 分析、简历优化和 AI provider 健康检查中。简历导入子域已经有 `prompts/` 目录先例，本轮把该实践扩展成 AI 模块的默认约定。

## 本次目标

- 把 RAG ask、AI 分析报告、简历优化、AI 健康检查 prompt 从业务逻辑中抽离。
- 保持所有 API 请求/响应和 provider 接口不变。
- 为 prompt builder 补最小单测，覆盖双语分支和核心约束。
- 在 AI module README 中记录后续 prompt 管理规范。

## 非目标

- 不引入 prompt registry、版本化系统或远程 prompt 配置。
- 不调整模型选择、temperature、structured output 或 JSON repair 逻辑。
- 不改前端类型和 API client wire shape。

## 实际改动

- 新增 `application/prompts/`：
  - `ai-connectivity.prompt.ts`
  - `analysis-report.prompt.ts`
  - `resume-optimization.prompt.ts`
- 新增 `rag/prompts/rag-ask.prompt.ts`，保持 RAG 子域就近管理。
- 补齐简历导入子域尾巴：
  - 将结构化识别 system prompt 放入 `resume-import-recognition.prompt.ts`。
  - 将 JSON repair prompt 放入 `resume-import-json-repair.prompt.ts`，并通过旧工具文件 re-export 保持兼容。
- `AppController`、`AiReportController`、`AiResumeOptimizationService`、`RagService` 改为调用 prompt builder。
- 删除 AI report controller 与 resume optimization service 内部的大段 prompt 拼接私有方法。
- 新增 prompt builder 单测，断言关键约束、语言分支和业务输入进入 prompt。
- 更新 `apps/server/src/modules/ai/README.md`，明确后续 prompt 新增规范。

## Review 记录

- 范围控制：本轮只做 prompt 管理结构治理，不改 provider 和业务行为。
- 分层取舍：RAG prompt 放在 `rag/prompts`；跨子域 prompt 放在 `application/prompts`；简历导入既有子域 prompt 不迁移。
- 测试策略：不硬编码完整 prompt 文案，只验证核心约束，避免后续 prompt 微调导致测试过脆。

## 测试与验证

已执行：

```bash
pnpm --filter @my-resume/server test -- src/modules/ai/application/prompts/__tests__/*.spec.ts src/modules/ai/rag/prompts/__tests__/rag-ask.prompt.spec.ts src/modules/ai/rag/__tests__/rag.service.spec.ts src/modules/ai/__tests__/ai-report.controller.spec.ts src/modules/ai/__tests__/ai-resume-optimization.service.spec.ts src/__tests__/app.controller.spec.ts
pnpm --filter @my-resume/server typecheck
```

补充说明：本次测试命令在当前 Vitest 匹配下实际覆盖了 server 侧 59 个测试文件、229 个用例，均已通过。

## 后续可写成教程/博客的点

- Prompt 为什么不应该散落在业务 service/controller 里。
- 如何管理双语 prompt：同文件 locale 分支，而不是复制两套业务逻辑。
- Prompt 单测应该测约束和语义，不应该把完整长文本写死。

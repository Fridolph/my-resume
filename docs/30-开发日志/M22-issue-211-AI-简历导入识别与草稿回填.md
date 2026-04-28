# M22 / Issue 211 - AI 简历导入识别与草稿回填

## 背景

开源用户首次使用 `my-resume` 时，往往已经有一份自己的 Markdown/TXT 简历。如果只能手动从空表单开始录入，完整体验链路会断在“如何把已有简历迁入系统”这一步。

本次 Issue 的目标是补上第一版可跑通闭环：上传中文简历文件，经 AI 识别为 `StandardResume` 候选草稿，展示模块级 diff，再由用户选择模块写回当前 draft。

## 本次目标

- 支持中文 `md/txt` 简历上传识别。
- 第一版限制文件大小和文本长度，避免无限制输入进入 AI。
- AI 输出必须归一化并通过 `validateStandardResume` 后才允许进入 apply。
- Admin AI 工作台新增“简历导入识别”入口。
- 新增结果看台，按模块展示当前草稿与候选草稿差异。
- 用户确认后按模块写回 draft；发布态仍保持手动发布流程。

## 非目标

- 不支持 PDF/DOCX 第一版识别。
- 不做英文自动识别。
- 不做自动发布。
- 不把导入内容直接写入 RAG 知识库。
- 不做字段级逐项勾选，第一版只做模块级 apply。

## 实际改动

### Server

- 新增 `ResumeImportRecognitionService`。
- 复用 `FileExtractionService`，但在导入识别入口额外限制只允许 `md/txt`。
- 增加边界规则：文件不超过 `1MB`，提取文本长度在 `500~50000` 字符之间。
- mock 模式下提供确定性 Markdown 解析器，用 `public/lifeiyu-mock-zh.md` 风格样例生成候选 `StandardResume`。
- provider 模式下固定要求 JSON 输出，并在服务端做 JSON 提取、归一化和 schema 校验。
- 新增临时结果缓存：`resultId -> candidateResume/detail/draftUpdatedAt`。
- 新增模块级 diff：`added / changed / unchanged / warning`。
- 新增 apply 逻辑：只把选中模块写回当前 draft，并用草稿时间戳防止旧识别结果覆盖新草稿。
- 新增 `AiResumeImportController`：
  - `POST /api/ai/resume-import/recognize`
  - `GET /api/ai/resume-import/results/:resultId`
  - `POST /api/ai/resume-import/apply`

### API Client

- 新增简历导入相关类型：模块、diff、统计、结果、apply 输入输出。
- 新增方法：
  - `createRecognizeAiResumeImportMethod`
  - `createFetchAiResumeImportResultMethod`
  - `createApplyAiResumeImportMethod`

### Admin

- AI 工作台新增“简历导入识别”卡片。
- 新增导入结果页：`/dashboard/ai/resume-import/results/:resultId`。
- 看台展示：
  - 识别摘要
  - 模块统计
  - warnings
  - 当前草稿 vs 候选草稿模块 diff
- 支持单模块写回和批量写回。
- 写回后提示“公开站仍需手动发布”。

## 设计思路

### 为什么不直接覆盖草稿

AI 识别属于高风险输入：用户上传内容可能格式混乱，AI 也可能漏字段或误解字段。直接覆盖 draft 会让用户失去可控性。

因此第一版采用：

1. 上传文件。
2. 生成候选草稿。
3. 展示模块级 diff。
4. 用户确认模块。
5. 只写回选中模块。

这保持了“AI 辅助，但人确认”的产品边界。

### 为什么只支持 md/txt

PDF/DOCX 的文本抽取质量和版式噪声更复杂，容易把第一版问题扩大成“文件解析质量问题”。当前先把重点放在结构化识别、schema 校验、diff apply 这条主链路，后续再把 PDF/DOCX 作为独立 Issue 加入。

### 为什么 mock 模式也做解析

测试和开发不能默认调用真实 AI。mock 模式下如果只返回固定示例，就无法验证 `lifeiyu-mock-zh.md` 这类真实输入能否走通。

所以本次 mock 使用轻量 Markdown parser，让样例文件成为稳定回归用例：既不花 AI 成本，也能验证“上传文本 -> StandardResume 候选草稿”的核心模型。

### 为什么用模块级 diff

字段级 diff 很细，但第一版会引入较多 UI 和交互复杂度。模块级 diff 更符合教程型节奏：

- 用户容易理解。
- apply 逻辑更清晰。
- 后续可以自然演进到字段级勾选。

## Review 记录

- 已检查识别入口不会写发布态。
- 已检查导入结果不会进入 RAG 知识库。
- 已检查真实 AI 路径必须通过 JSON 解析与 `validateStandardResume`。
- 已检查 apply 只写回选中模块。
- 已检查 draft 时间戳冲突时会拒绝旧结果回填。

## 测试与验证

已执行：

```bash
pnpm --filter @my-resume/server test -- src/modules/ai/__tests__/resume-import-recognition.service.spec.ts src/modules/ai/__tests__/ai-resume-import.controller.spec.ts
pnpm --filter @my-resume/server typecheck
pnpm --filter @my-resume/api-client test -- src/ai.spec.ts
pnpm --filter @my-resume/api-client typecheck
cd apps/admin && pnpm exec vitest run "app/[locale]/dashboard/ai/_ai/__tests__/resume-import-panel.spec.tsx" "app/[locale]/dashboard/ai/_ai/__tests__/resume-import-result-shell.spec.tsx"
cd apps/admin && pnpm exec vitest run "app/[locale]/dashboard/ai/_ai/__tests__/ai-workbench-shell.spec.tsx"
pnpm --filter @my-resume/admin typecheck
```

补充说明：直接运行整套 Admin 测试时，当前仓库仍存在两个与本次改动无关的既有失败/波动：

- `login-form.spec.tsx`：demo admin 密码填充断言为空。
- `user-doc-ingestion-panel.spec.tsx`：`published` 文案多处匹配导致测试查询歧义。

本次未修改这些 unrelated 用例。

## 后续可写教程/博客切入点

- 为什么 AI 导入不能直接覆盖业务草稿。
- 文件上传边界：类型、大小、文本长度和错误提示。
- AI JSON 输出不可信时，服务端如何做提取、归一化、校验和兜底。
- mock provider 如何避免开发阶段误触发真实 AI 成本。
- 从模块级 diff 到字段级 diff 的渐进式设计。

## 后续建议

- 增加真实 AI 手工验证脚本或开发态按钮，用 `lifeiyu-mock-zh.md` 做端到端演示。
- 将 PDF/DOCX 支持拆成独立 Issue。
- 后续引入字段级 diff 时，优先从 `profile` 和 `projects` 两个模块试点。

# AI Module

- 职责：AI 能力地图、简历导入识别、简历针对性分析、user_docs 最小入库、文件提取诊断、优化记录与结果看台。
- 首页入口：`ai-workbench-shell.tsx`，只负责展示 Provider/草稿摘要与 Card 子模块入口，不再承载具体上传/分析表单。
- 子模块入口：
  - `resume-import-shell.tsx`：上传中文 md/txt 简历，异步识别候选草稿并进入 diff 看台。
  - `resume-optimization-shell.tsx`：读取当前草稿，结合 JD/优化要求生成结构化建议。
  - `knowledge-ingestion-shell.tsx`：上传 user_docs 并写入 RAG 检索态。
  - `file-extraction-shell.tsx`：单文件文本提取诊断。
  - `optimization-history-shell.tsx`：优化记录回看与复用。
- 结构：`components/`、`services/`、`utils/`、`types/`、`__tests__/`
- 边界：导入识别、草稿优化、RAG 入库、文件提取与历史记录保持页面级职责分离，避免 AI 工作台首页继续变成混合操作页。

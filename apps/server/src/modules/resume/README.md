# resume module

## 模块职责
- 管理简历草稿与发布快照（读取、保存、发布）。
- 提供公开读取、后台编辑与导出（Markdown / PDF）接口。
- 输出简历摘要供公开端与后台轻量渲染。

## 目录分层（NestJS 风格）
- `domain/`：领域模型与纯领域规则（例如 `StandardResume`、校验与归一化）。
- `application/`：用例层类型与编排辅助（本模块快照类型在 `application/types/`）。
- `transport/`：HTTP 层 DTO/响应类型（controller 对外返回类型从这里引用）。
- 根目录 service/controller/repository：保持各自职责，不内联重复类型定义。

## 类型管理约定
- 快照类类型统一通过 `ResumeSnapshot<S, TResume>` 组合生成，避免 `draft/published + summary/full` 重复声明。
- 对外保留稳定别名：
  - `ResumeDraftSnapshot`
  - `ResumePublishedSnapshot`
  - `ResumeDraftSummarySnapshot`
  - `ResumePublishedSummarySnapshot`
- controller 不在文件内新增临时响应 interface，统一引用 `transport/types`。

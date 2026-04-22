# resume module

## 模块职责
- 管理简历草稿与发布快照（读取、保存、发布）。
- 提供公开读取、后台编辑与导出（Markdown / PDF）接口。
- 输出简历摘要供公开端与后台轻量渲染。

## 目录分层（NestJS 风格）
- `domain/`：领域模型与纯领域规则（例如 `StandardResume`、校验与归一化）。
- `application/services/`：简历用例编排（发布、导出、RAG 同步、摘要）。
- `application/types/`：应用层快照类型定义。
- `transport/controllers/`：HTTP 控制器入口。
- `transport/types/`：controller 对外响应类型。
- `infrastructure/repositories/`：仓储与持久化访问。
- 根目录保留兼容 `re-export`，支持渐进迁移。

## 类型管理约定
- 快照类类型统一通过 `ResumeSnapshot<S, TResume>` 组合生成，避免 `draft/published + summary/full` 重复声明。
- 对外保留稳定别名：
  - `ResumeDraftSnapshot`
  - `ResumePublishedSnapshot`
  - `ResumeDraftSummarySnapshot`
  - `ResumePublishedSummarySnapshot`
- controller 不在文件内新增临时响应 interface，统一引用 `transport/types`。

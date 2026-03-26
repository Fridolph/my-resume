# packages/api-client

当前阶段的最小共享契约包。

## 当前已承载

- 简历领域的共享类型：
  - `StandardResume`
  - `ResumeDraftSnapshot`
  - `ResumePublishedSnapshot`
- 简历相关的最小请求方法：
  - `fetchPublishedResume`
  - `fetchDraftResume`
  - `updateDraftResume`
  - `publishResume`
- 已发布导出链接构造：
  - `buildPublishedResumeExportUrl`

## 当前边界

- 只先覆盖简历主链路，不一次性做完整 SDK
- 不引入 OpenAPI 代码生成
- 不处理复杂缓存、重试、拦截器和错误码体系

## 设计取舍

- 先抽“最容易重复、最容易漂移”的类型和请求
- `apps/admin` 与 `apps/web` 仍允许保留薄封装文件，方便渐进迁移和教程讲解
- 等后续 issue 再继续扩到更多模块，而不是一次性把所有接口搬进来

## 当前阶段不做

- 不生成完整 SDK
- 不生成 OpenAPI 类型
- 不接入 AI、附件等非简历模块

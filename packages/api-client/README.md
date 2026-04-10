# packages/api-client

当前阶段的共享请求契约包，已升级为 `alova + 适配器` 结构。

## 当前已承载

- 简历领域的共享类型：
  - `StandardResume`
  - `ResumeDraftSnapshot`
  - `ResumePublishedSnapshot`
- 简历相关请求方法：
  - `fetchPublishedResume`
  - `fetchDraftResume`
  - `updateDraftResume`
  - `publishResume`
- 鉴权请求方法：
  - `loginWithPassword`
  - `fetchCurrentUser`
  - `postProtectedAction`
- AI 工作台请求方法：
  - `fetchAiWorkbenchRuntime`
  - `triggerAiWorkbenchAnalysis`
  - `generateAiResumeOptimization`
  - `applyAiResumeOptimization`
  - `fetchCachedAiWorkbenchReports`
  - `fetchCachedAiWorkbenchReport`
  - `extractTextFromFile`
- 已发布导出链接构造：
  - `buildPublishedResumeExportUrl`
- 请求内核能力：
  - `createApiClient`
  - `createFetchAdapter`
  - `createAxiosAdapter`
  - `type HttpAdapter`
  - `type RequestPolicy`
- 类型分层：
  - `src/types/client.types.ts`
  - `src/types/auth.types.ts`
  - `src/types/ai.types.ts`
  - `src/types/resume.types.ts`

## 当前边界

- 继续保持手写 SDK，不引入 OpenAPI 代码生成
- 不改变后端路由、返回结构和业务语义

## 设计取舍

- 默认采用 `fetch` 适配器，保留 `axios` 适配器扩展位
- `axios` 适配器需要业务侧自行安装并注入 axios instance，不作为本包默认运行时依赖
- 默认超时：读请求 `10s`，写请求 `15s`
- 默认重试：仅 `GET` 自动重试（指数退避），写请求不自动重试
- 业务层继续使用语义化函数，避免页面直接拼接请求细节

## 当前阶段不做

- 不引入第二套状态管理库
- 不改变 server 端缓存头和发布链路

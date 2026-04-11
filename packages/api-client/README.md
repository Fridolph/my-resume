# packages/api-client

当前阶段的共享请求契约包，已升级为 `alova Method-first + 官方 hooks` 结构。

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
  - `createXxxMethod`（按领域导出的 Method 工厂）
  - `defaultApiClient.createMethod`
- 类型分层：
  - `src/types/client.types.ts`
  - `src/types/auth.types.ts`
  - `src/types/ai.types.ts`
  - `src/types/resume.types.ts`

## 当前边界

- 继续保持手写 SDK，不引入 OpenAPI 代码生成
- 不改变后端路由、返回结构和业务语义

## 推荐调用方式

- Method-first（推荐）：
  - 在页面/Hook 中优先使用 `createXxxMethod(...)`
  - SSR 中可直接 `await method.send()`
  - CSR 中优先配合 `useRequest/useWatcher`
- Promise 兼容层（过渡）：
  - 继续可用 `fetchXxx/publishXxx/loginXxx` 等函数
  - 内部已改为 `createMethod(...).send()`，便于页面逐步切到官方 hooks

## 设计取舍

- 默认采用官方 `createAlova + alova/fetch`
- `beforeRequest` 统一注入 `Authorization`
- `responded` 统一处理 `json/text/raw`、`204`、`404 -> null` 与错误消息提取
- 业务层继续使用语义化函数，避免页面直接拼接请求细节
- 不再维护自定义 runtime / retry / axios / legacy adapter 兼容层

## 当前阶段不做

- 不引入第二套状态管理库
- 不改变 server 端缓存头和发布链路

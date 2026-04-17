# packages/api-client

当前阶段的共享请求契约包，已升级为 `alova Method-first + 官方 hooks` 结构。

## 当前已承载

- 简历领域的共享类型：
  - `StandardResume`
  - `ResumeDraftSnapshot`
  - `ResumePublishedSnapshot`
- 按领域导出的 Method 工厂：
  - `createXxxMethod`
- 已发布导出链接构造：
  - `buildPublishedResumeExportUrl`
- 请求内核能力：
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
  - SSR 中可直接 `await createXxxMethod(...)` 或 `await method.send()`
  - CSR 中优先配合 `useRequest/useWatcher`

## 迁移示例

- SSR（推荐）：
  - `const published = await createFetchPublishedResumeMethod({ apiBaseUrl })`
- CSR（推荐）：
  - `const { data, loading, error, send } = useRequest(() => createFetchPublishedResumeMethod({ apiBaseUrl }), { immediate: false })`

## 设计取舍

- 默认采用官方 `createAlova + alova/fetch`
- `beforeRequest` 统一注入 `Authorization`
- `responded` 统一处理 `json/text/raw`、`204`、`404 -> null` 与错误消息提取
- `json` 响应支持自动解包标准 envelope：`{ code, message, data, timestamp, traceId }`
- 错误响应支持提取 `traceId`，便于联动服务端日志排障
- 业务层继续使用语义化函数，避免页面直接拼接请求细节
- 不再维护自定义 runtime / retry / axios / legacy adapter 兼容层

## 当前阶段不做

- 不引入第二套状态管理库
- 不改变 server 端缓存头和发布链路

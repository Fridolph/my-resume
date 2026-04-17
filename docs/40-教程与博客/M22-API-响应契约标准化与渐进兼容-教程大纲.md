# M22 API 响应契约标准化与渐进兼容教程大纲

## 一、为什么要做响应契约标准化

- 成功与失败结构不一致会放大前端分支复杂度
- 统一结构后可沉淀通用请求层和可观测能力
- AI 场景下失败链路更复杂，traceId 价值更高

## 二、目标契约与边界

- 目标结构：`{ code, message, data, timestamp, traceId }`
- 本轮只改 transport 层，不改业务语义
- 不引入复杂 observability 平台

## 三、NestJS 方案设计

### 1) 成功链路

- `ResponseEnvelopeInterceptor` 统一包装成功返回
- 兼容已是 envelope 的返回值

### 2) 失败链路

- `ApiExceptionFilter` 统一异常体
- 兼容字符串、数组和对象错误消息

### 3) raw 旁路

- `SkipResponseEnvelope` 保证下载接口不被包裹

## 四、traceId 贯穿策略

- 请求头优先复用 `x-trace-id`
- 缺失时服务端生成
- 响应头回传 + 错误体携带

## 五、api-client 渐进兼容

- 继续支持旧响应
- 新增 envelope 自动解包
- 错误信息携带 traceId，便于定位日志

## 六、测试策略

- server: interceptor/filter 覆盖 success/error/raw 三分支
- api-client: envelope success/error 与旧结构兼容
- admin/web: typecheck + 关键链路回归

## 七、常见坑

- 直接全量切换导致前端大面积解析失败
- 忘记处理 raw 导出导致下载接口返回 JSON 包裹
- traceId 只在 header，不在错误体，排障体验差

## 八、后续演进

- 将 envelope 契约扩展到 SSE 事件元信息
- 增加错误码字典与 i18n 友好消息映射
- 对齐日志平台，形成 traceId 一键检索路径

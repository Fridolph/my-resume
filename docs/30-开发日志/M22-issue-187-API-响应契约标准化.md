# M22 / issue-187 API 响应契约标准化

- Issue: #187
- 里程碑: M22 AI Chat 流式交互与会话体验
- 分支: `fys-dev/feat-m22-issue-187-api-response-envelope`

## 背景

当前 `apps/server` 成功响应是业务实体直出，失败响应是 Nest 默认异常结构。随着 `admin/web` 与后续 `ai-talk` 链路增长，前端需要稳定的统一响应契约，便于通用错误处理、监控定位和日志串联。

目标响应形态收敛为：

```json
{
  "code": 200,
  "message": "OK",
  "data": {},
  "timestamp": "2026-04-17T00:00:00.000Z",
  "traceId": "..."
}
```

## 本次目标

- 在 `apps/server` 增加全局成功响应拦截与异常过滤
- 注入并透传 `traceId`
- 对下载类 raw 接口提供 envelope 旁路能力
- 在 `@my-resume/api-client` 增加 envelope 自动解包与错误提取兼容
- 保持业务方法签名不变，降低迁移成本

## 实际改动

### 1) server 统一响应层

- 新增 `ResponseEnvelopeInterceptor`
  - 成功响应统一包装为 `{ code, message, data, timestamp, traceId }`
  - 若返回值已经是 envelope 形态，仅补齐缺失字段
- 新增 `ApiExceptionFilter`
  - 统一异常响应结构
  - 兼容字符串、数组、对象多种错误消息来源
- 新增 `SkipResponseEnvelope` 装饰器
  - 用于 `markdown/pdf` 导出这类 raw 输出接口

### 2) traceId 注入

- 在 `main.ts` 通过 express 中间件注入 `x-trace-id`
- 优先复用请求头中的 traceId，没有则生成 UUID
- 同时写入响应头，方便前后端联动排障

### 3) api-client 兼容

- `json` 响应自动识别并解包标准 envelope
- 非 envelope 响应继续兼容
- 错误响应支持提取 `traceId` 并拼接到错误信息

## Review 记录

- 是否会导致全量破坏: 通过 `api-client` 双形态解析做了迁移缓冲
- raw 导出是否受影响: 使用 `@SkipResponseEnvelope()` 明确旁路
- 是否改动业务语义: 未变更控制器路由与领域逻辑，仅增强 transport 层

## 测试与验证

- `pnpm --filter @my-resume/server test`
- `pnpm --filter @my-resume/server typecheck`
- `pnpm --filter @my-resume/api-client test`
- `pnpm --filter @my-resume/api-client typecheck`
- `pnpm --filter @my-resume/admin typecheck`
- `pnpm --filter @my-resume/web typecheck`

## 遇到的问题

- 分支前期基线在 `development` 旧提交，后续已重置到最新 `main`
- `zsh` 脚本在数组解析和 `sed` 提取 issue 编号时有兼容差异，改为更稳的解析方式

## 后续可写成教程的切入点

- 为什么 API 契约标准化不能一刀切
- 如何在 NestJS 用 interceptor + filter 做渐进式改造
- traceId 如何贯穿前后端错误定位

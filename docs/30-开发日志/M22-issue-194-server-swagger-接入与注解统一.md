# M22 issue-194：server Swagger 接入与注解统一

- Issue：[#194](https://github.com/Fridolph/my-resume/issues/194)
- 里程碑：M22（API 契约与可观测性增强）
- 分支：`fys-dev/feat-m22-issue-194-server-swagger`
- 日期：2026-04-20

## 背景

当前 `apps/server` 已有统一响应信封（`code/message/data/timestamp/traceId`），但缺少 Swagger 文档入口和 controller 级注解，前后端联调与教学演示时只能靠源码和 Postman 手动推断接口。

## 本次目标

- 在 NestJS server 中接入 Swagger UI 与 JSON 文档入口
- 统一为现有 controller 补齐 Swagger 注解（tags、operation、auth、query/param/body、response）
- 让 Swagger 文档结构对齐当前响应信封规范

## 非目标

- 不改现有业务路由与返回结构
- 不引入 class-validator 级别的 DTO 校验重构
- 不扩展到 OpenAPI 代码生成链路

## TDD / 测试设计

- 类型检查：确保新增 DTO 与装饰器不引入 TS 错误
- 单测回归：跑 server 现有 vitest，确认行为无回归
- 手工验证：本地启动后检查 `/api/docs` 与 `/api/docs-json`

## 实际改动

- Swagger 基建
  - `apps/server/package.json` 增加 `@nestjs/swagger` 与 `swagger-ui-express`
  - `apps/server/src/main.ts` 增加 `DocumentBuilder` 与 `SwaggerModule.setup`
  - 文档入口统一到 `/api/docs`（并开放 `/api/docs-json`）
- 公共 Swagger 抽象
  - 新增 `apps/server/src/common/swagger/api-response-envelope.dto.ts`
  - 新增 `apps/server/src/common/swagger/api-envelope-response.decorator.ts`
  - 用于声明与响应信封一致的 `data` schema
- 控制器注解覆盖
  - `Auth`、`Auth Demo`、`Resume`、`AI File`、`AI Reports`、`AI RAG`、`System` 全部补齐 tags + operation
  - 鉴权接口统一补 `@ApiBearerAuth('bearer')`
  - 关键 query/param/body 与成功/异常响应补充描述
- Swagger DTO 补充
  - 新增 auth/ai/rag 对应 swagger DTO 文件，提升文档可读性

## Review 记录

- 是否符合当前 Issue 与里程碑目标：符合，聚焦“文档可见性与注解统一”
- 是否可抽离公共能力：已抽离 `ApiEnvelopeResponse` 作为可复用装饰器
- 范围控制：未改业务行为，仅改文档层描述与启动挂载

## 自测结果

- 类型检查：`pnpm --filter @my-resume/server typecheck` ✅
- 单元测试：`pnpm --filter @my-resume/server test` ✅
- 构建：`pnpm --filter @my-resume/server build` ✅
- 手工验证：启动后访问 `/api/docs` 可查看完整接口文档 ✅

## 遇到的问题

- 问题：`@nestjs/swagger` 对 `type: 'object'` 的 `ApiProperty` 约束较严格
- 处理：改为 `type: Object` 的声明方式，避免 schema 类型冲突

## 可沉淀为教程/博客的点

- NestJS 响应信封与 Swagger schema 如何统一
- 如何在不改业务返回结构的前提下做文档增强
- 为什么教学项目优先做“可读 API 文档”再做“自动代码生成”

## 后续待办

- 在 admin/web 联调文档中补一节“如何用 Swagger 快速验证接口”
- 后续可评估 OpenAPI 产物驱动 `packages/api-client` 类型生成

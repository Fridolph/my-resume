# M22：NestJS Swagger 接入与接口注解统一（教程大纲）

## 一、这篇要解决什么问题

- server 已有稳定 API，但“看不见、讲不清、联调慢”
- 缺少统一 API 文档入口，新同学只能读 controller 源码
- 响应已标准化为 envelope，但文档没有同步表达这层契约

## 二、目标与边界

### 目标

- 接入 Swagger UI（`/api/docs`）与 JSON（`/api/docs-json`）
- 为全部业务 controller 补齐注解，覆盖请求与响应关键字段
- 文档层对齐 `code/message/data/timestamp/traceId` 响应信封

### 非目标

- 不改接口协议与返回结构
- 不做大规模 DTO 校验重构
- 不在本篇引入 OpenAPI 自动生成客户端

## 三、整体设计思路

1. **先搭入口**：在 `main.ts` 挂 SwaggerModule
2. **再抽共性**：封装 `ApiEnvelopeResponse`，复用到各 controller
3. **后补细节**：按模块补 `tags/operation/auth/query/param/body/response`
4. **最后验收**：typecheck + test + build + 手工看文档

## 四、关键实现拆解

### 1）main.ts 文档初始化

- `DocumentBuilder` 定义 title/description/version
- 配置 Bearer 鉴权方案，和当前 JWT 机制对齐
- `SwaggerModule.setup('docs', ..., { useGlobalPrefix: true })`

### 2）响应信封装饰器

- `ApiResponseEnvelopeDto` 描述统一顶层字段
- `ApiEnvelopeResponse` 按 `data` 的对象/数组/nullable 生成 schema
- controller 只关心业务类型，避免每个方法手写重复 schema

### 3）控制器注解策略

- 类级：`@ApiTags`，按业务域分组
- 鉴权：受保护接口统一 `@ApiBearerAuth('bearer')`
- 方法级：`@ApiOperation` + `@ApiEnvelopeResponse` + 常见错误响应装饰器
- 参数：`@ApiQuery`、`@ApiParam`、Body DTO

## 五、和当前项目的结合点

- `apps/admin` 与 `apps/web` 在联调时可直接对照 `/api/docs`
- `packages/api-client` 可以在后续里程碑评估接入 OpenAPI 产物
- 教学链路上，“响应信封标准化 → Swagger 可视化”形成完整闭环

## 六、常见坑与规避

- `ApiProperty` 声明对象类型时优先用 `type: Object`
- 导出类接口（文件下载）要结合 `@ApiProduces`
- 启用全局前缀时，Swagger 建议 `useGlobalPrefix: true`
- 文档注解要覆盖异常分支，避免“只写 happy path”

## 七、可继续扩展的方向

- 接入 class-validator，Swagger schema 与运行时校验更一致
- 引入 OpenAPI 生成类型，减少 `api-client` 手写维护成本
- 增加 e2e：校验 `/api/docs-json` 关键路径与 schema 不回退

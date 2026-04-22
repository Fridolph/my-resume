# apps/server modules 架构约定

本目录按“模块自治 + 渐进 DDD”组织，不做一次性大重构。

## 标准目录骨架

每个模块默认包含以下目录：

- `domain/`：领域对象、规则与领域内约束
- `application/services/`：用例编排与应用服务
- `infrastructure/repositories/`：数据库仓储与外部依赖适配
- `transport/controllers/`：HTTP 控制器
- `transport/dto/`：HTTP 请求/响应 DTO
- `__tests__/`：模块相关测试

## 依赖方向（默认）

- `transport -> application -> domain`
- `infrastructure -> domain`
- `application` 可依赖 `infrastructure` 中的仓储抽象或实现（当前教学阶段允许最小实现直连）
- 禁止 `domain` 反向依赖 `transport` 或 `infrastructure`

## 渐进迁移策略

- 老路径可先通过 `re-export` 兼容，避免一次性改断现有测试与调用链
- 新增代码优先写入分层目录，不再把新实现堆回模块根目录
- 每轮只迁移当前 Issue 相关模块，避免跨里程碑扩张

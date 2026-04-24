# auth module

## 模块职责

- 提供登录、JWT 校验与角色能力守卫
- 维护鉴权领域模型与能力策略
- 维护 `users` 表账号数据（admin/viewer）与密码哈希校验

## 目录边界（当前）

- `application/services/`：鉴权用例编排（登录、token 验证）
- `infrastructure/repositories/`：`users` 表读写与初始化兜底
- `transport/controllers/`：HTTP 登录与鉴权演示入口
- `domain/`：用户角色与能力策略
- `decorators/` + `guards/`：鉴权传输层适配
- `dto/`：登录与 Swagger DTO
- `interfaces/`：鉴权上下文类型
- `__tests__/`：模块相关测试

## 兼容策略

- 旧路径 `auth.service.ts` / `auth.controller.ts` / `auth-demo.controller.ts` 保留 `re-export`
- 现有调用无需一次性改完，可按 Issue 渐进迁移

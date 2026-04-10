# core

`apps/web/core` 只放跨模块基础设施。

## 当前内容

- `env.ts`：公开站环境变量读取与默认 API 地址

## 边界

- 不放单一业务模块专属类型、组件或展示逻辑
- 业务 API、业务 types、业务 helpers 回到各自模块维护

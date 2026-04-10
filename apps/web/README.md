# apps/web

公开简历展示端。

## 当前职责

- 提供公开简历最小展示壳
- 只读取 `apps/server` 已发布内容
- 提供最小 `zh/en` 语言切换
- 提供最小 `light / dark` 主题切换

## 当前结构

- `app/`：Next App Router 入口
- `core/`：跨模块基础设施
- `modules/published-resume/`：公开简历主阅读链路
- `modules/profile/`：公开概览页
- `modules/ai-talk/`：AI Talk 入口
- `modules/site/`：公开站共享头部与导航

## 模块约定

- 每个模块优先自带 `README.md`、`__tests__/` 与 `types/`
- 业务 API、业务 types、业务 helpers 尽量留在当前模块，不再回灌到全局 `lib/`

## 环境变量

- `RESUME_API_BASE_URL`：服务端渲染时优先使用的后端地址
- `NEXT_PUBLIC_API_BASE_URL`：兼容前后端统一配置的公开 API 地址
- 默认回退：`http://localhost:5577`

## 当前阶段不做

- 不做复杂视觉设计
- 不做模板切换
- 不在 `Next Route Handlers` 中承载业务逻辑

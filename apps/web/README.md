# apps/web

公开简历展示端。

## 当前职责

- 提供公开简历最小展示壳
- 只读取 `apps/server` 已发布内容
- 提供最小 `zh/en` 语言切换
- 提供最小 `light / dark` 主题切换

## 当前结构

- `app/[locale]/`：route-first 主树
- `app/[locale]/_resume/`：首页私有展示组合
- `app/[locale]/profile/_profile/`：概览页私有实现
- `app/[locale]/ai-talk/_ai-talk/`：AI Talk 私有实现
- `app/_shared/site/`：公开路由共享头部与导航
- `app/_shared/published-resume/`：多路由复用的已发布简历数据链路
- `app/_core/`：站点级基础设施与 i18n 适配

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

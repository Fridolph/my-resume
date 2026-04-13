# apps/admin

`apps/admin` 是后台管理端的最小 Next.js App Router 应用。

## 当前阶段职责

- 承接最小登录页
- 调用 `apps/server` 的 `/api/auth/login` 与 `/api/auth/me`
- 提供最小受保护页面壳

## 当前结构

- `app/login/`：后台登录路由
- `app/dashboard/`：无前缀后台主树
- `app/[locale]/_auth/`：登录页私有实现
- `app/[locale]/dashboard/_shared/`：dashboard 子树共享壳
- `app/[locale]/dashboard/resume/_resume/`：简历编辑器
- `app/[locale]/dashboard/ai/_ai/`：AI 工作台
- `app/[locale]/dashboard/publish/_publish/`：发布与导出
- `app/_shared/ui/`：后台跨路由复用 UI
- `app/_core/`：站点级 provider、session 与 i18n 基础设施

其中 `app/[locale]/**` 当前主要保留为共享实现与旧地址重定向过渡层，不再作为后台正式 URL 入口。

## 当前阶段不做

- 不实现完整后台 UI
- 不接内容管理
- 不在 Next Route Handlers 中编写业务逻辑

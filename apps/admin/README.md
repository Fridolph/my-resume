# apps/admin

`apps/admin` 是后台管理端的最小 Next.js App Router 应用。

## 当前阶段职责

- 承接最小登录页
- 调用 `apps/server` 的 `/auth/login` 与 `/auth/me`
- 提供最小受保护页面壳

## 当前结构

- `app/[locale]/`：route-first 主树
- `app/[locale]/_auth/`：登录页私有实现
- `app/[locale]/dashboard/_shared/`：dashboard 子树共享壳
- `app/[locale]/dashboard/resume/_resume/`：简历编辑器
- `app/[locale]/dashboard/ai/_ai/`：AI 工作台
- `app/[locale]/dashboard/publish/_publish/`：发布与导出
- `app/_shared/ui/`：后台跨路由复用 UI
- `app/_core/`：站点级 provider、session 与 i18n 基础设施

## 当前阶段不做

- 不实现完整后台 UI
- 不接内容管理
- 不在 Next Route Handlers 中编写业务逻辑
